const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { Telegraf } = require('telegraf');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// 🔐 قراءة Secret Files من Render
// ============================================================

let serviceAccount = null;
let firebaseWebConfig = {};
let ADMIN_ID = null;
let ADMIN_PASSWORD = null;
let TON_API_KEY = null;
let COINPAYMENTS_PUBLIC = null;
let COINPAYMENTS_PRIVATE = null;

try {
    const firebasePath = '/etc/secrets/firebase-admin-key.json';
    if (fs.existsSync(firebasePath)) {
        serviceAccount = JSON.parse(fs.readFileSync(firebasePath, 'utf8'));
        console.log('✅ Firebase Admin key loaded');
    }
} catch (error) {
    console.error('❌ Firebase Admin key error:', error.message);
}

try {
    const configPath = '/etc/secrets/firebase-web-config.json';
    firebaseWebConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('✅ Firebase Web config loaded');
} catch (error) {
    console.error('❌ Firebase Web config error:', error.message);
}

try {
    const adminPath = '/etc/secrets/admin-config.json';
    const adminConfig = JSON.parse(fs.readFileSync(adminPath, 'utf8'));
    ADMIN_ID = adminConfig.admin_id;
    ADMIN_PASSWORD = adminConfig.admin_password;
    console.log('✅ Admin config loaded');
} catch (error) {
    console.error('❌ Admin config error:', error.message);
}

try {
    const tonPath = '/etc/secrets/ton-api-key.txt';
    TON_API_KEY = fs.readFileSync(tonPath, 'utf8').trim();
    console.log('✅ TON API key loaded');
} catch (error) {
    console.error('❌ TON API key error:', error.message);
}

try {
    const cpPath = '/etc/secrets/coinpayments-keys.json';
    const cpKeys = JSON.parse(fs.readFileSync(cpPath, 'utf8'));
    COINPAYMENTS_PUBLIC = cpKeys.public_key;
    COINPAYMENTS_PRIVATE = cpKeys.private_key;
    console.log('✅ CoinPayments keys loaded');
} catch (error) {
    console.error('❌ CoinPayments keys error:', error.message);
}

// ============================================================
// Environment Variables
// ============================================================
const BOT_TOKEN = process.env.BOT_TOKEN;
const APP_URL = process.env.APP_URL;
const OWNER_WALLET = process.env.OWNER_WALLET;
const WELCOME_BONUS = 1000;
const REFERRAL_BONUS = 500;

// ============================================================
// 🔥 Firebase Admin SDK Setup
// ============================================================
const admin = require('firebase-admin');
let db = null;

if (serviceAccount) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        db = admin.firestore();
        console.log('🔥 Firebase Admin SDK initialized');
    } catch (error) {
        console.error('❌ Firebase init error:', error.message);
    }
}

// ============================================================
// 🛠️ Helper Functions
// ============================================================
function getDefaultMissions() {
    return {
        mission1: { completed: false, revealed: true, walletAddress: null },
        mission2: { completed: false, revealed: false, currentAmount: 0, requiredAmount: 12500 },
        mission3: { completed: false, revealed: false, referralsAtStart: 0, currentNewReferrals: 0, requiredReferrals: 12 },
        mission4: { completed: false, revealed: false, revealDate: null, requiredBNB: 0.025, requiredSOL: 0.25 }
    };
}

function createNewUserData(userId, userName, userUsername, refCode) {
    return {
        userId,
        userName,
        userUsername: userUsername || '',
        balances: { TROLL: WELCOME_BONUS, BNB: 0, SOL: 0, ETH: 0, TRON: 0 },
        referralCode: userId,
        referredBy: refCode || null,
        referrals: [],
        inviteCount: 0,
        referralEarnings: 0,
        totalEarned: WELCOME_BONUS,
        premium: false,
        avatar: '🧌',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        withdrawalUnlocked: false,
        claimedMilestones: [],
        tonWallet: null,
        settings: { solanaWallet: null },
        withdrawalMissions: getDefaultMissions(),
        notifications: [{
            id: Date.now().toString(),
            message: `🎉 Welcome! +${WELCOME_BONUS} TROLL bonus!`,
            read: false,
            timestamp: new Date().toISOString()
        }],
        transactions: []
    };
}

// ============================================================
// 🤖 Telegram Bot Setup
// ============================================================
const bot = new Telegraf(BOT_TOKEN);
const welcomeCache = new Map();

bot.start(async (ctx) => {
    const refCode = ctx.startPayload;
    const userId = ctx.from.id.toString();
    const userName = ctx.from.first_name || 'Troll';
    const userUsername = ctx.from.username || '';
    
    const cacheKey = `${userId}_welcome`;
    const now = Date.now();
    if (welcomeCache.has(cacheKey) && (now - welcomeCache.get(cacheKey)) < 5000) {
        return;
    }
    welcomeCache.set(cacheKey, now);
    
    if (db) {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            const userData = createNewUserData(userId, userName, userUsername, refCode);
            await userRef.set(userData);
            console.log(`✅ New user created via bot: ${userId}`);
            
            if (refCode && refCode !== userId) {
                const referrerRef = db.collection('users').doc(refCode);
                const referrerDoc = await referrerRef.get();
                
                if (referrerDoc.exists) {
                    const referrerData = referrerDoc.data();
                    if (!referrerData.referrals?.includes(userId)) {
                        await referrerRef.update({
                            referrals: admin.firestore.FieldValue.arrayUnion(userId),
                            inviteCount: admin.firestore.FieldValue.increment(1),
                            'balances.TROLL': admin.firestore.FieldValue.increment(REFERRAL_BONUS),
                            referralEarnings: admin.firestore.FieldValue.increment(REFERRAL_BONUS),
                            totalEarned: admin.firestore.FieldValue.increment(REFERRAL_BONUS)
                        });
                        
                        bot.telegram.sendMessage(
                            refCode,
                            `🧌 *New Troll Recruited!*\n\n+${REFERRAL_BONUS} TROLL\nTotal Trolls: ${(referrerData.inviteCount || 0) + 1}`,
                            { parse_mode: 'Markdown' }
                        ).catch(() => {});
                    }
                }
            }
        }
    }
    
    await ctx.reply(
        `🧌 *Welcome to Troll Army, ${userName}!*\n\n` +
        `🎁 Welcome Bonus: *${WELCOME_BONUS} TROLL*\n` +
        `👥 Referral Bonus: *${REFERRAL_BONUS} TROLL*\n\n` +
        `🔮 *Mystery Missions System*\n` +
        `Complete 4 mystery missions to unlock withdrawal!\n\n` +
        `_Mission 1: Add your Solana wallet_ 😏`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🧌 Open Troll Wallet', web_app: { url: APP_URL } }],
                    [{ text: '📢 Join Troll Channel', url: 'https://t.me/TrollOfficial' }]
                ]
            }
        }
    );
});

bot.command('stats', async (ctx) => {
    const userId = ctx.from.id.toString();
    if (!db) return ctx.reply('⚠️ Maintenance mode...');
    
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
        const data = userDoc.data();
        const missions = data.withdrawalMissions || getDefaultMissions();
        const completed = [missions.mission1, missions.mission2, missions.mission3, missions.mission4].filter(m => m?.completed).length;
        
        await ctx.reply(
            `🧌 *Your Troll Stats*\n\n` +
            `💰 Balance: ${data.balances?.TROLL?.toLocaleString() || 0} TROLL\n` +
            `👥 Invites: ${data.inviteCount || 0}\n` +
            `🔮 Missions: ${completed}/4 completed\n` +
            `💎 Withdrawal: ${data.withdrawalUnlocked ? '✅ Unlocked' : '❌ Locked'}\n` +
            `😏 Premium: ${data.premium ? '✅ Yes' : '❌ No'}\n\n` +
            `🔗 Your link: t.me/${ctx.botInfo.username}?start=${userId}`,
            { parse_mode: 'Markdown' }
        );
    } else {
        ctx.reply('❌ User not found. Please start the bot first with /start');
    }
});

bot.command('broadcast', async (ctx) => {
    const userId = ctx.from.id.toString();
    if (userId !== ADMIN_ID) {
        return ctx.reply('⛔ Not authorized!');
    }
    
    const message = ctx.message.text.replace('/broadcast', '').trim();
    if (!message) {
        return ctx.reply('Usage: /broadcast Your message here');
    }
    
    if (db) {
        const usersSnapshot = await db.collection('users').get();
        let successCount = 0;
        
        for (const doc of usersSnapshot.docs) {
            try {
                await bot.telegram.sendMessage(doc.id, `📢 *Announcement*\n\n${message}`, { parse_mode: 'Markdown' });
                successCount++;
                await new Promise(r => setTimeout(r, 50));
            } catch (e) {}
        }
        
        ctx.reply(`✅ Broadcast sent to ${successCount} users`);
    }
});

// Kill old webhook then launch
bot.telegram.deleteWebhook({ drop_pending_updates: true })
    .then(() => bot.launch({ dropPendingUpdates: true }))
    .then(() => console.log('🤖 Bot started with Long Polling'))
    .catch(err => console.error('❌ Bot launch error:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// ============================================================
// 🌐 Middleware
// ============================================================
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ============================================================
// 📡 API Endpoints
// ============================================================

app.get('/api/health', (req, res) => {
    res.json({ status: 'trolling 🧌', firebase: db ? 'connected' : 'disconnected', timestamp: Date.now() });
});

app.get('/api/ping', (req, res) => {
    res.json({ alive: true, timestamp: Date.now() });
});

app.get('/api/config', (req, res) => {
    res.json({
        firebaseConfig: firebaseWebConfig,
        appUrl: APP_URL,
        adminId: ADMIN_ID,
        ownerWallet: OWNER_WALLET,
        botLink: 'https://t.me/TROLLMiniappbot/instant'
    });
});

// ====== INIT USER (AUTO AUTHENTICATION) - NEW! ======
app.post('/api/init-user', async (req, res) => {
    try {
        const { initData } = req.body;
        
        if (!initData) {
            return res.json({ success: false, error: 'No initData' });
        }
        
        const params = new URLSearchParams(initData);
        const userJson = params.get('user');
        
        if (!userJson) {
            return res.json({ success: false, error: 'No user data' });
        }
        
        const user = JSON.parse(decodeURIComponent(userJson));
        const userId = user.id.toString();
        const userName = user.first_name || 'Troll';
        const userUsername = user.username || '';
        
        console.log('📱 Init user:', userId, userName);
        
        if (!db) {
            return res.json({ success: false, error: 'Database not connected' });
        }
        
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        let userData;
        
        if (userDoc.exists) {
            userData = userDoc.data();
            console.log('✅ Existing user:', userId);
        } else {
            userData = createNewUserData(userId, userName, userUsername, null);
            await userRef.set(userData);
            console.log('✅ New user created via init:', userId);
        }
        
        res.json({ success: true, userId: userId, userData: userData });
        
    } catch (error) {
        console.error('❌ Init user error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ====== USER APIs ======
app.get('/api/users/:userId', async (req, res) => {
    if (!db) return res.json({ success: false, error: 'Database not connected' });
    try {
        const doc = await db.collection('users').doc(req.params.userId).get();
        res.json({ success: true, data: doc.exists ? doc.data() : null });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/users', async (req, res) => {
    if (!db) return res.json({ success: true, mock: true });
    
    try {
        const { userId, userData } = req.body;
        
        if (!userId || !userData) {
            return res.status(400).json({ success: false, error: 'Missing userId or userData' });
        }
        
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
            return res.json({ success: true, message: 'User already exists' });
        }
        
        await userRef.set({
            ...userData,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`✅ New user created via API: ${userId}`);
        res.json({ success: true });
        
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.patch('/api/users/:userId', async (req, res) => {
    if (!db) return res.json({ success: true, mock: true });
    try {
        const { updates } = req.body;
        await db.collection('users').doc(req.params.userId).update({
            ...updates,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ====== REFERRAL API ======
app.post('/api/referral', async (req, res) => {
    if (!db) return res.json({ success: true, mock: true });
    try {
        const { referrerId, newUserId } = req.body;
        
        if (!referrerId || !newUserId || referrerId === newUserId) {
            return res.json({ success: false, error: 'Invalid referral data' });
        }
        
        const referrerRef = db.collection('users').doc(referrerId);
        const referrerDoc = await referrerRef.get();
        
        if (referrerDoc.exists) {
            const referrerData = referrerDoc.data();
            if (!referrerData.referrals?.includes(newUserId)) {
                await referrerRef.update({
                    referrals: admin.firestore.FieldValue.arrayUnion(newUserId),
                    inviteCount: admin.firestore.FieldValue.increment(1),
                    'balances.TROLL': admin.firestore.FieldValue.increment(REFERRAL_BONUS),
                    referralEarnings: admin.firestore.FieldValue.increment(REFERRAL_BONUS),
                    totalEarned: admin.firestore.FieldValue.increment(REFERRAL_BONUS)
                });
                
                bot.telegram.sendMessage(
                    referrerId,
                    `🧌 *New Troll Recruited!*\n\n+${REFERRAL_BONUS} TROLL\nTotal Trolls: ${(referrerData.inviteCount || 0) + 1}`,
                    { parse_mode: 'Markdown' }
                ).catch(() => {});
            }
        }
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ====== MILESTONE API ======
app.post('/api/claim-milestone', async (req, res) => {
    if (!db) return res.json({ success: true, mock: true });
    try {
        const { userId, milestoneReferrals, reward } = req.body;
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
            const data = userDoc.data();
            const claimed = data.claimedMilestones || [];
            
            if (!claimed.includes(milestoneReferrals) && data.inviteCount >= milestoneReferrals) {
                await userRef.update({
                    'balances.TROLL': admin.firestore.FieldValue.increment(reward),
                    totalEarned: admin.firestore.FieldValue.increment(reward),
                    claimedMilestones: admin.firestore.FieldValue.arrayUnion(milestoneReferrals)
                });
                
                bot.telegram.sendMessage(
                    userId,
                    `🎉 *Milestone Claimed!*\n\n+${reward.toLocaleString()} TROLL`,
                    { parse_mode: 'Markdown' }
                ).catch(() => {});
            }
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ====== PREMIUM API ======
app.post('/api/buy-premium', async (req, res) => {
    if (!db) return res.json({ success: true, mock: true });
    try {
        const { userId, txHash } = req.body;
        
        const userRef = db.collection('users').doc(userId);
        await userRef.update({
            premium: true,
            avatar: '😏',
            withdrawalUnlocked: true,
            premiumTxHash: txHash,
            premiumPurchasedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        bot.telegram.sendMessage(
            userId,
            `😏 *Premium Unlocked!*\n\nYou now have the legendary Troll Face avatar and INSTANT withdrawal access!`,
            { parse_mode: 'Markdown' }
        ).catch(() => {});
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ====== DEPOSIT API ======
app.post('/api/deposit-address', async (req, res) => {
    try {
        const { userId, currency } = req.body;
        const mockAddress = currency === 'SOL' ? 'GzR' + userId.slice(-40).padStart(40, '0') : `0x${userId.slice(-40).padStart(40, '0')}`;
        
        res.json({ 
            success: true, 
            address: mockAddress,
            network: currency === 'SOL' ? 'Solana' : 'BSC (BEP-20)',
            minDeposit: currency === 'TROLL' ? 10000 : 0.01
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ====== WITHDRAWAL STATUS API ======
app.get('/api/withdrawal-status/:userId', async (req, res) => {
    if (!db) return res.json({ canWithdraw: false });
    try {
        const userDoc = await db.collection('users').doc(req.params.userId).get();
        if (!userDoc.exists) return res.json({ canWithdraw: false });
        
        const user = userDoc.data();
        
        if (user.premium) {
            return res.json({ canWithdraw: true, unlockedBy: 'premium' });
        }
        
        const missions = user.withdrawalMissions || getDefaultMissions();
        const allCompleted = missions.mission1?.completed && 
                            missions.mission2?.completed && 
                            missions.mission3?.completed && 
                            missions.mission4?.completed;
        
        res.json({
            canWithdraw: allCompleted,
            missions: missions,
            distributionDate: allCompleted ? 'May 1, 2026' : null
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ====== ADMIN APIs ======
function isAdmin(req) {
    const authHeader = req.headers.authorization;
    return authHeader === `Bearer ${ADMIN_PASSWORD}`;
}

app.get('/api/admin/users', async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Unauthorized' });
    if (!db) return res.json({ users: [] });
    
    try {
        const snapshot = await db.collection('users').limit(100).get();
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ users });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/add-balance', async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Unauthorized' });
    if (!db) return res.json({ success: true });
    
    try {
        const { userId, currency, amount } = req.body;
        await db.collection('users').doc(userId).update({
            [`balances.${currency}`]: admin.firestore.FieldValue.increment(amount)
        });
        
        bot.telegram.sendMessage(
            userId,
            `💰 *Admin added ${amount} ${currency} to your wallet!*`,
            { parse_mode: 'Markdown' }
        ).catch(() => {});
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/broadcast', async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Unauthorized' });
    if (!db) return res.json({ success: true });
    
    try {
        const { message } = req.body;
        const usersSnapshot = await db.collection('users').get();
        let successCount = 0;
        
        for (const doc of usersSnapshot.docs) {
            try {
                await bot.telegram.sendMessage(doc.id, `📢 *Announcement*\n\n${message}`, { parse_mode: 'Markdown' });
                successCount++;
                await new Promise(r => setTimeout(r, 50));
            } catch (e) {}
        }
        
        res.json({ success: true, sentTo: successCount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 🏠 Serve Frontend
// ============================================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ============================================================
// 🚀 Start Server
// ============================================================
app.listen(PORT, () => {
    console.log(`\n🧌 Troll Army Server`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`🔥 Firebase: ${db ? '✅ Connected' : '❌ Disconnected'}`);
    console.log(`👑 Admin ID: ${ADMIN_ID || '❌ Not configured'}`);
    console.log(`🤖 Bot: ${BOT_TOKEN ? '✅ Configured' : '❌ Missing'}`);
    console.log(`🌐 App URL: ${APP_URL}`);
    console.log(`\n✅ Server ready!\n`);
});
