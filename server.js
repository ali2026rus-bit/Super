// ============================================================
// TROLL ARMY - SERVER.JS (PRODUCTION READY)
// Express API + Telegram Bot (Long Polling) + Firebase Admin
// ============================================================

const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { Telegraf } = require('telegraf');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// 🔐 قراءة Secret Files من Render
// ============================================================

// 1. Firebase Admin SDK
let serviceAccount = null;
try {
    const firebasePath = '/etc/secrets/firebase-admin-key.json';
    if (fs.existsSync(firebasePath)) {
        serviceAccount = JSON.parse(fs.readFileSync(firebasePath, 'utf8'));
        console.log('✅ Firebase Admin key loaded');
    } else {
        console.log('⚠️ firebase-admin-key.json not found');
    }
} catch (error) {
    console.error('❌ Firebase Admin key error:', error.message);
}

// 2. Firebase Web Config
let firebaseWebConfig = {};
try {
    const configPath = '/etc/secrets/firebase-web-config.json';
    if (fs.existsSync(configPath)) {
        firebaseWebConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log('✅ Firebase Web config loaded');
    } else {
        console.log('⚠️ firebase-web-config.json not found');
    }
} catch (error) {
    console.error('❌ Firebase Web config error:', error.message);
}

// 3. Admin Config
let ADMIN_ID = null;
let ADMIN_PASSWORD = null;
try {
    const adminPath = '/etc/secrets/admin-config.json';
    if (fs.existsSync(adminPath)) {
        const adminConfig = JSON.parse(fs.readFileSync(adminPath, 'utf8'));
        ADMIN_ID = adminConfig.admin_id;
        ADMIN_PASSWORD = adminConfig.admin_password;
        console.log('✅ Admin config loaded');
    } else {
        console.log('⚠️ admin-config.json not found');
        ADMIN_ID = process.env.ADMIN_ID || '1653918641';
    }
} catch (error) {
    console.error('❌ Admin config error:', error.message);
    ADMIN_ID = process.env.ADMIN_ID || '1653918641';
}

// 4. TON API Key
let TON_API_KEY = null;
try {
    const tonPath = '/etc/secrets/ton-api-key.txt';
    if (fs.existsSync(tonPath)) {
        TON_API_KEY = fs.readFileSync(tonPath, 'utf8').trim();
        console.log('✅ TON API key loaded');
    } else {
        console.log('⚠️ ton-api-key.txt not found');
        TON_API_KEY = process.env.TON_API_KEY || '';
    }
} catch (error) {
    console.error('❌ TON API key error:', error.message);
    TON_API_KEY = process.env.TON_API_KEY || '';
}

// 5. CoinPayments Keys
let COINPAYMENTS_PUBLIC = null;
let COINPAYMENTS_PRIVATE = null;
try {
    const cpPath = '/etc/secrets/coinpayments-keys.json';
    if (fs.existsSync(cpPath)) {
        const cpKeys = JSON.parse(fs.readFileSync(cpPath, 'utf8'));
        COINPAYMENTS_PUBLIC = cpKeys.public_key;
        COINPAYMENTS_PRIVATE = cpKeys.private_key;
        console.log('✅ CoinPayments keys loaded');
    } else {
        console.log('⚠️ coinpayments-keys.json not found - using mock addresses');
    }
} catch (error) {
    console.log('⚠️ CoinPayments keys not found - using mock addresses');
}

// ============================================================
// Environment Variables
// ============================================================
const BOT_TOKEN = process.env.BOT_TOKEN;
const APP_URL = process.env.APP_URL;
const OWNER_WALLET = process.env.OWNER_WALLET;
const SUPPORT_USERNAME = process.env.SUPPORT_USERNAME || 'TrollSupport';

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
} else {
    console.log('⚠️ Firebase not initialized - missing service account');
}

// ============================================================
// 🤖 Telegram Bot Setup (Long Polling)
// ============================================================
const bot = new Telegraf(BOT_TOKEN);
const welcomeCache = new Map();

// أمر /start
bot.start(async (ctx) => {
    const refCode = ctx.startPayload;
    const userId = ctx.from.id.toString();
    const userName = ctx.from.first_name || 'Troll';
    
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
            await userRef.set({
                userId,
                userName,
                balances: { TROLL: 1000 },
                referralCode: userId,
                referredBy: refCode || null,
                referrals: [],
                inviteCount: 0,
                totalEarned: 1000,
                premium: false,
                avatar: '🧌',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                withdrawalUnlocked: false,
                claimedMilestones: [],
                tonWallet: null
            });
            
            if (refCode && refCode !== userId) {
                const referrerRef = db.collection('users').doc(refCode);
                const referrerDoc = await referrerRef.get();
                if (referrerDoc.exists) {
                    const referrerData = referrerDoc.data();
                    if (!referrerData.referrals?.includes(userId)) {
                        await referrerRef.update({
                            referrals: admin.firestore.FieldValue.arrayUnion(userId),
                            inviteCount: admin.firestore.FieldValue.increment(1),
                            'balances.TROLL': admin.firestore.FieldValue.increment(500),
                            totalEarned: admin.firestore.FieldValue.increment(500)
                        });
                        
                        bot.telegram.sendMessage(
                            refCode,
                            `🧌 *New Troll Recruited!*\n\n+500 TROLL\nTotal Trolls: ${(referrerData.inviteCount || 0) + 1}`,
                            { parse_mode: 'Markdown' }
                        );
                    }
                }
            }
        }
    }
    
    await ctx.reply(
        `🧌 *Welcome to Troll Army, ${userName}!*\n\n` +
        `You got *1,000 TROLL* as welcome bonus!\n` +
        `Invite friends to earn *500 TROLL* each.\n\n` +
        `_Complete missions to unlock withdrawal!_ 😏`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🧌 Open Troll Wallet', web_app: { url: APP_URL } }]
                ]
            }
        }
    );
});

// أمر /stats
bot.command('stats', async (ctx) => {
    const userId = ctx.from.id.toString();
    if (db) {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
            const data = userDoc.data();
            await ctx.reply(
                `🧌 *Your Troll Stats*\n\n` +
                `💰 Balance: ${data.balances?.TROLL?.toLocaleString() || 0} TROLL\n` +
                `👥 Invites: ${data.inviteCount || 0}\n` +
                `🔗 Your link: t.me/${ctx.botInfo.username}?start=${userId}\n` +
                `💎 Premium: ${data.premium ? '✅ Yes' : '❌ No'}`,
                { parse_mode: 'Markdown' }
            );
        }
    }
});

// أمر /broadcast (للمشرف فقط)
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

// ============================================================
// 🚀 Long Polling Setup
// ============================================================
bot.launch({ dropPendingUpdates: true })
    .then(() => console.log('🤖 Bot started with Long Polling'))
    .catch(err => console.error('❌ Bot launch error:', err.message));

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

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'trolling 🧌',
        firebase: db ? 'connected' : 'disconnected',
        timestamp: Date.now()
    });
});

// Ping (لمنع نوم Render)
app.get('/api/ping', (req, res) => {
    res.json({ alive: true, timestamp: Date.now() });
});

// إرسال الإعدادات للفرونت إند
app.get('/api/config', (req, res) => {
    res.json({
        firebaseConfig: firebaseWebConfig,
        appUrl: APP_URL,
        adminId: ADMIN_ID,
        ownerWallet: OWNER_WALLET,
        supportUsername: SUPPORT_USERNAME
    });
});

// Get user
app.get('/api/users/:userId', async (req, res) => {
    if (!db) return res.json({ success: true, data: null });
    try {
        const doc = await db.collection('users').doc(req.params.userId).get();
        res.json({ success: true, data: doc.exists ? doc.data() : null });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create user
app.post('/api/users', async (req, res) => {
    if (!db) return res.json({ success: true });
    try {
        const { userId, userData } = req.body;
        await db.collection('users').doc(userId).set(userData);
        console.log(`✅ User created: ${userId}`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update user
app.patch('/api/users/:userId', async (req, res) => {
    if (!db) return res.json({ success: true });
    try {
        const { updates } = req.body;
        await db.collection('users').doc(req.params.userId).update(updates);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Process referral
app.post('/api/referral', async (req, res) => {
    if (!db) return res.json({ success: true });
    try {
        const { referrerId, newUserId } = req.body;
        
        if (!referrerId || !newUserId || referrerId === newUserId) {
            return res.json({ success: false, error: 'Invalid data' });
        }
        
        const referrerRef = db.collection('users').doc(referrerId);
        const referrerDoc = await referrerRef.get();
        
        if (referrerDoc.exists) {
            const referrerData = referrerDoc.data();
            if (!referrerData.referrals?.includes(newUserId)) {
                await referrerRef.update({
                    referrals: admin.firestore.FieldValue.arrayUnion(newUserId),
                    inviteCount: admin.firestore.FieldValue.increment(1),
                    'balances.TROLL': admin.firestore.FieldValue.increment(500),
                    totalEarned: admin.firestore.FieldValue.increment(500)
                });
                
                bot.telegram.sendMessage(
                    referrerId,
                    `🧌 *New Troll Recruited!*\n\n+500 TROLL`,
                    { parse_mode: 'Markdown' }
                );
            }
        }
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Claim milestone
app.post('/api/claim-milestone', async (req, res) => {
    if (!db) return res.json({ success: true });
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
                );
            }
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Withdrawal status (المهام الغامضة)
app.get('/api/withdrawal-status/:userId', async (req, res) => {
    if (!db) return res.json({ canWithdraw: false });
    try {
        const userDoc = await db.collection('users').doc(req.params.userId).get();
        if (!userDoc.exists) return res.json({ canWithdraw: false });
        
        const user = userDoc.data();
        
        if (user.premium) {
            return res.json({ canWithdraw: true, unlockedBy: 'premium' });
        }
        
        const missions = [
            { id: 'referrals', requirement: 12, current: user.inviteCount || 0 },
            { id: 'balance', requirement: 15000, current: user.balances?.TROLL || 0 },
            { id: 'bnb', requirement: 0.02, current: user.externalBalances?.BNB || 0 }
        ];
        
        const allCompleted = missions.every(m => m.current >= m.requirement);
        
        res.json({
            canWithdraw: allCompleted,
            missions: missions.map(m => ({
                ...m,
                completed: m.current >= m.requirement,
                progress: Math.min((m.current / m.requirement) * 100, 100)
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Deposit address (CoinPayments or mock)
app.post('/api/deposit-address', async (req, res) => {
    try {
        const { userId, currency } = req.body;
        let address = '';
        
        if (COINPAYMENTS_PUBLIC && COINPAYMENTS_PRIVATE) {
            // TODO: CoinPayments API call
            address = `CP_${currency}_${userId.slice(0, 10)}`;
        } else {
            const prefixes = { SOL: 'So1', BNB: '0x', ETH: '0x', TRON: 'T', TROLL: '0x' };
            address = `${prefixes[currency] || ''}${userId.slice(-40).padStart(40, '0')}`;
        }
        
        res.json({ success: true, address });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Buy premium
app.post('/api/buy-premium', async (req, res) => {
    if (!db) return res.json({ success: true });
    try {
        const { userId, txHash } = req.body;
        
        await db.collection('users').doc(userId).update({
            premium: true,
            avatar: '😏',
            withdrawalUnlocked: true,
            premiumTxHash: txHash,
            premiumPurchasedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        bot.telegram.sendMessage(
            userId,
            `😏 *Premium Unlocked!*\n\nInstant withdrawal enabled!`,
            { parse_mode: 'Markdown' }
        );
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 👑 Admin API
// ============================================================
function isAdmin(req) {
    const authHeader = req.headers.authorization;
    return authHeader === `Bearer ${ADMIN_PASSWORD}`;
}

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
    console.log(`🧌 Troll Army running on port ${PORT}`);
    console.log(`🔥 Firebase: ${db ? 'Connected' : 'Disconnected'}`);
    console.log(`👑 Admin ID: ${ADMIN_ID || 'Not configured'}`);
    console.log(`🤖 Bot: ${BOT_TOKEN ? 'Configured' : 'Missing'}`);
    console.log(`💳 CoinPayments: ${COINPAYMENTS_PUBLIC ? 'Configured' : 'Mock'}`);
    console.log(`🌐 App URL: ${APP_URL}`);
});
