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
let ADMIN_ID = null, ADMIN_PASSWORD = null;
let TON_API_KEY = null;
let COINPAYMENTS_PUBLIC = null, COINPAYMENTS_PRIVATE = null;

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
const REFERRAL_BONUS = 500;
const WELCOME_BONUS = 1000;

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
// 🤖 Telegram Bot Setup (Long Polling)
// ============================================================
const bot = new Telegraf(BOT_TOKEN);
const welcomeCache = new Map();

// أمر /start
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
            // إنشاء مستخدم جديد مع نظام المهام الغامضة
            await userRef.set({
                userId,
                userName,
                userUsername,
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
                settings: { solanaWallet: null, language: 'ar', theme: 'dark' },
                withdrawalMissions: {
                    mission1: { completed: false, revealed: true, walletAddress: null, savedAt: null },
                    mission2: { completed: false, revealed: false, requiredAmount: 12500, currentAmount: 0, startDate: null },
                    mission3: { completed: false, revealed: false, requiredReferrals: 12, referralsAtStart: 0, currentNewReferrals: 0, startDate: null },
                    mission4: { completed: false, revealed: false, revealDate: null, requiredBNB: 0.025, requiredSOL: 0.25 }
                },
                notifications: [{
                    id: Date.now().toString(),
                    message: '🎉 أهلاً بك في Troll Army! +1,000 TROLL',
                    read: false,
                    timestamp: new Date().toISOString()
                }]
            });
            
            console.log(`✅ New user created: ${userId}`);
            
            // معالجة الإحالة
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
                        
                        // إشعار للمُحيل
                        bot.telegram.sendMessage(
                            refCode,
                            `🧌 *مجند جديد في جيشك!*\n\n+500 TROLL\nإجمالي المجندين: ${(referrerData.inviteCount || 0) + 1}`,
                            { parse_mode: 'Markdown' }
                        ).catch(() => {});
                    }
                }
            }
        }
    }
    
    await ctx.reply(
        `🧌 *مرحباً ${userName} في جيش التصيد!*\n\n` +
        `🎁 مكافأة ترحيبية: *1,000 TROLL*\n` +
        `👥 دعوة صديق: *500 TROLL*\n\n` +
        `🔮 *نظام المهام الغامضة*\n` +
        `أكمل 4 مهام غامضة لفتح السحب!\n\n` +
        `_المهمة الأولى: أضف محفظة Solana_ 😏`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🧌 افتح المحفظة', web_app: { url: APP_URL } }],
                    [{ text: '📢 قناة Troll', url: 'https://t.me/TrollOfficial' }]
                ]
            }
        }
    );
});

// أمر /stats
bot.command('stats', async (ctx) => {
    const userId = ctx.from.id.toString();
    if (!db) return ctx.reply('⚠️ جاري الصيانة...');
    
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
        const data = userDoc.data();
        const missions = data.withdrawalMissions;
        const completed = [missions.mission1, missions.mission2, missions.mission3, missions.mission4].filter(m => m.completed).length;
        
        await ctx.reply(
            `🧌 *إحصائياتك*\n\n` +
            `💰 الرصيد: ${data.balances?.TROLL?.toLocaleString() || 0} TROLL\n` +
            `👥 الإحالات: ${data.inviteCount || 0}\n` +
            `🔮 المهام: ${completed}/4 مكتملة\n` +
            `💎 السحب: ${data.withdrawalUnlocked ? '✅ متاح' : '❌ مقفل'}\n` +
            `😏 بريميوم: ${data.premium ? '✅ مفعل' : '❌ لا'}`,
            { parse_mode: 'Markdown' }
        );
    }
});

// ============================================================
// 🚀 Long Polling Setup
// ============================================================
bot.launch({ dropPendingUpdates: true })
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

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'trolling 🧌', 
        firebase: db ? 'connected' : 'disconnected',
        timestamp: Date.now() 
    });
});

// إرسال الإعدادات للفرونت إند
app.get('/api/config', (req, res) => {
    res.json({
        firebaseConfig: firebaseWebConfig,
        appUrl: APP_URL,
        adminId: ADMIN_ID,
        ownerWallet: OWNER_WALLET
    });
});

// ====== USER APIs ======

// Get user
app.get('/api/users/:userId', async (req, res) => {
    if (!db) return res.json({ success: false, error: 'Database not connected' });
    try {
        const doc = await db.collection('users').doc(req.params.userId).get();
        if (doc.exists) {
            res.json({ success: true, data: doc.data() });
        } else {
            res.json({ success: true, data: null });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create user
app.post('/api/users', async (req, res) => {
    if (!db) return res.json({ success: false, error: 'Database not connected' });
    try {
        const { userId, userData } = req.body;
        await db.collection('users').doc(userId).set(userData);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update user
app.patch('/api/users/:userId', async (req, res) => {
    if (!db) return res.json({ success: false, error: 'Database not connected' });
    try {
        const { updates } = req.body;
        await db.collection('users').doc(req.params.userId).update(updates);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ====== REFERRAL API ======

app.post('/api/referral', async (req, res) => {
    if (!db) return res.json({ success: false, error: 'Database not connected' });
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
                
                // تحديث المهمة 2 و 3 تلقائياً
                const updatedDoc = await referrerRef.get();
                const updatedData = updatedDoc.data();
                const missions = updatedData.withdrawalMissions;
                
                // تحديث المهمة 2
                if (missions.mission2.revealed && !missions.mission2.completed) {
                    missions.mission2.currentAmount = (updatedData.inviteCount || 0) * REFERRAL_BONUS;
                    if (missions.mission2.currentAmount >= missions.mission2.requiredAmount) {
                        missions.mission2.completed = true;
                        if (!missions.mission3.revealed) {
                            missions.mission3.revealed = true;
                            missions.mission3.startDate = new Date().toISOString();
                            missions.mission3.referralsAtStart = updatedData.inviteCount || 0;
                        }
                    }
                }
                
                // تحديث المهمة 3
                if (missions.mission3.revealed && !missions.mission3.completed) {
                    missions.mission3.currentNewReferrals = (updatedData.inviteCount || 0) - (missions.mission3.referralsAtStart || 0);
                    if (missions.mission3.currentNewReferrals >= missions.mission3.requiredReferrals) {
                        missions.mission3.completed = true;
                        const revealDate = new Date();
                        revealDate.setDate(revealDate.getDate() + 20);
                        missions.mission4.revealDate = revealDate.toISOString();
                    }
                }
                
                await referrerRef.update({ withdrawalMissions: missions });
                
                // إرسال إشعار
                bot.telegram.sendMessage(
                    referrerId,
                    `🧌 *مجند جديد!* +500 TROLL\n\n📊 تقدم المهمة 3: ${missions.mission3.currentNewReferrals || 0}/12`,
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
    if (!db) return res.json({ success: false, error: 'Database not connected' });
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
                    `🎉 *مرحلة جديدة!*\n\n+${reward.toLocaleString()} TROLL`,
                    { parse_mode: 'Markdown' }
                ).catch(() => {});
            }
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ====== DEPOSIT API ======

app.post('/api/deposit-address', async (req, res) => {
    try {
        const { userId, currency } = req.body;
        const mockAddress = `0x${userId.slice(-40).padStart(40, '0')}`;
        
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
        
        const missions = user.withdrawalMissions;
        const allCompleted = missions.mission1.completed && 
                            missions.mission2.completed && 
                            missions.mission3.completed && 
                            missions.mission4.completed;
        
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

app.post('/api/admin/broadcast', async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Unauthorized' });
    if (!db) return res.json({ success: true });
    
    try {
        const { message } = req.body;
        const usersSnapshot = await db.collection('users').get();
        let successCount = 0;
        
        for (const doc of usersSnapshot.docs) {
            try {
                await bot.telegram.sendMessage(doc.id, `📢 *إعلان*\n\n${message}`, { parse_mode: 'Markdown' });
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
    console.log(`🧌 Troll Army v15.0 running on port ${PORT}`);
    console.log(`🔥 Firebase: ${db ? 'Connected' : 'Disconnected'}`);
    console.log(`👑 Admin ID: ${ADMIN_ID || 'Not configured'}`);
    console.log(`🤖 Bot: ${BOT_TOKEN ? 'Configured' : 'Missing'}`);
    console.log(`🌐 App URL: ${APP_URL}`);
});
