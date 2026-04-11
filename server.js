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

// 1. Firebase Service Account
let serviceAccount = null;
try {
    const firebasePath = '/etc/secrets/firebase-key.json';
    if (fs.existsSync(firebasePath)) {
        serviceAccount = JSON.parse(fs.readFileSync(firebasePath, 'utf8'));
        console.log('✅ Firebase key loaded from Secret File');
    } else {
        console.log('⚠️ firebase-key.json not found in /etc/secrets/');
    }
} catch (error) {
    console.error('❌ Firebase key error:', error.message);
}

// 2. Admin Config
let ADMIN_ID = null;
let ADMIN_PASSWORD = null;
try {
    const adminPath = '/etc/secrets/admin-config.json';
    if (fs.existsSync(adminPath)) {
        const adminConfig = JSON.parse(fs.readFileSync(adminPath, 'utf8'));
        ADMIN_ID = adminConfig.admin_id;
        ADMIN_PASSWORD = adminConfig.admin_password;
        console.log('✅ Admin config loaded from Secret File, ID:', ADMIN_ID);
    } else {
        console.log('⚠️ admin-config.json not found, checking environment...');
        ADMIN_ID = process.env.ADMIN_ID;
        ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    }
} catch (error) {
    console.error('❌ Admin config error:', error.message);
    ADMIN_ID = process.env.ADMIN_ID;
    ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
}

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
// 🤖 Telegram Bot Setup
// ============================================================
const BOT_TOKEN = process.env.BOT_TOKEN;
const APP_URL = process.env.APP_URL;
const bot = new Telegraf(BOT_TOKEN);

// أمر /start
bot.start(async (ctx) => {
    const refCode = ctx.startPayload;
    const userId = ctx.from.id.toString();
    const userName = ctx.from.first_name || 'Troll';
    
    if (db) {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            await userRef.set({
                userId,
                userName,
                balances: { TROLL: 10000 },
                referralCode: userId,
                referredBy: refCode || null,
                inviteCount: 0,
                totalEarned: 10000,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            // معالجة الإحالة
            if (refCode && refCode !== userId) {
                const referrerRef = db.collection('users').doc(refCode);
                const referrerDoc = await referrerRef.get();
                if (referrerDoc.exists) {
                    await referrerRef.update({
                        inviteCount: admin.firestore.FieldValue.increment(1),
                        'balances.TROLL': admin.firestore.FieldValue.increment(25000),
                        totalEarned: admin.firestore.FieldValue.increment(25000)
                    });
                    
                    bot.telegram.sendMessage(
                        refCode,
                        `🧌 *New Troll Recruited!*\n\n+25,000 TROLL\n\n_Your army grows!_`,
                        { parse_mode: 'Markdown' }
                    );
                }
            }
        }
    }
    
    await ctx.reply(
        `🧌 *Welcome to Troll Army, ${userName}!*\n\n` +
        `You've joined the troll revolution.\n` +
        `Complete tasks and earn $TROLL.\n\n` +
        `_Problem? 😏_`,
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
                `🔗 Your link: t.me/${ctx.botInfo.username}?start=${userId}`,
                { parse_mode: 'Markdown' }
            );
        }
    }
});

// ============================================================
// 🌐 Middleware
// ============================================================
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Webhook للبوت
app.use(await bot.createWebhook({ domain: APP_URL }));

// ============================================================
// 📡 API Endpoints
// ============================================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'trolling 🧌', 
        firebase: db ? 'connected' : 'disconnected',
        admin: ADMIN_ID ? 'configured' : 'missing',
        timestamp: Date.now() 
    });
});

// Ping endpoint (لـ Cron Job لمنع النوم)
app.get('/api/ping', (req, res) => {
    res.json({ alive: true, timestamp: Date.now(), message: 'Troll is awake! 🧌' });
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

// Create/Update user
app.post('/api/users', async (req, res) => {
    if (!db) return res.json({ success: true });
    try {
        const { userId, userData } = req.body;
        await db.collection('users').doc(userId).set(userData, { merge: true });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Process referral claim
app.post('/api/claim-milestone', async (req, res) => {
    if (!db) return res.json({ success: true });
    try {
        const { userId, milestoneReferrals, reward } = req.body;
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
            const data = userDoc.data();
            const claimed = data.claimedMilestones || [];
            
            if (!claimed.includes(milestoneReferrals)) {
                await userRef.update({
                    'balances.TROLL': admin.firestore.FieldValue.increment(reward),
                    totalEarned: admin.firestore.FieldValue.increment(reward),
                    claimedMilestones: admin.firestore.FieldValue.arrayUnion(milestoneReferrals)
                });
                
                bot.telegram.sendMessage(
                    userId,
                    `👑 *Milestone Claimed!*\n\n+${reward.toLocaleString()} TROLL\n\n_You're climbing the troll ranks!_`,
                    { parse_mode: 'Markdown' }
                );
            }
        }
        res.json({ success: true });
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
    console.log(`🌐 App URL: ${APP_URL}`);
});
