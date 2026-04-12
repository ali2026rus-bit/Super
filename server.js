// ============================================================
// TROLL ARMY - SERVER.JS (FIXED - USER REGISTRATION WORKS)
// ============================================================

const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { Telegraf } = require('telegraf');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ====== قراءة Secret Files ======
let serviceAccount = null;
try {
    const firebasePath = '/etc/secrets/firebase-admin-key.json';
    if (fs.existsSync(firebasePath)) {
        serviceAccount = JSON.parse(fs.readFileSync(firebasePath, 'utf8'));
        console.log('✅ Firebase Admin key loaded');
    }
} catch (error) {
    console.error('❌ Firebase Admin key error:', error.message);
}

let firebaseWebConfig = {};
try {
    const configPath = '/etc/secrets/firebase-web-config.json';
    if (fs.existsSync(configPath)) {
        firebaseWebConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log('✅ Firebase Web config loaded');
    }
} catch (error) {
    console.error('❌ Firebase Web config error:', error.message);
}

let ADMIN_ID = '1653918641';
let ADMIN_PASSWORD = null;
try {
    const adminPath = '/etc/secrets/admin-config.json';
    if (fs.existsSync(adminPath)) {
        const adminConfig = JSON.parse(fs.readFileSync(adminPath, 'utf8'));
        ADMIN_ID = adminConfig.admin_id;
        ADMIN_PASSWORD = adminConfig.admin_password;
        console.log('✅ Admin config loaded');
    }
} catch (error) {
    console.error('❌ Admin config error:', error.message);
}

// ====== Environment Variables ======
const BOT_TOKEN = process.env.BOT_TOKEN;
const APP_URL = process.env.APP_URL;
const OWNER_WALLET = process.env.OWNER_WALLET;

// ====== Firebase Admin SDK ======
const admin = require('firebase-admin');
let db = null;

if (serviceAccount) {
    try {
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        db = admin.firestore();
        console.log('🔥 Firebase connected');
    } catch (error) {
        console.error('❌ Firebase init error:', error.message);
    }
}

// ====== Telegram Bot ======
const bot = new Telegraf(BOT_TOKEN);

bot.start(async (ctx) => {
    const refCode = ctx.startPayload;
    const userId = ctx.from.id.toString();
    const userName = ctx.from.first_name || 'Troll';
    
    if (db) {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            await userRef.set({
                userId, userName,
                balances: { TROLL: 1000 },
                referralCode: userId,
                referredBy: refCode || null,
                referrals: [],
                inviteCount: 0,
                totalEarned: 1000,
                premium: false,
                avatar: '🧌',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            if (refCode && refCode !== userId) {
                const referrerRef = db.collection('users').doc(refCode);
                const referrerDoc = await referrerRef.get();
                if (referrerDoc.exists) {
                    await referrerRef.update({
                        referrals: admin.firestore.FieldValue.arrayUnion(userId),
                        inviteCount: admin.firestore.FieldValue.increment(1),
                        'balances.TROLL': admin.firestore.FieldValue.increment(500),
                        totalEarned: admin.firestore.FieldValue.increment(500)
                    });
                    
                    bot.telegram.sendMessage(refCode, `🧌 *New Troll!* +500 TROLL`, { parse_mode: 'Markdown' });
                }
            }
        }
    }
    
    await ctx.reply(`🧌 *Welcome ${userName}!*`, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '🧌 Open App', web_app: { url: APP_URL } }]] }
    });
});

bot.launch({ dropPendingUpdates: true }).then(() => console.log('🤖 Bot started')).catch(err => console.error('Bot error:', err));

// ====== Middleware ======
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ====== API Endpoints ======
app.get('/api/ping', (req, res) => res.json({ alive: true }));

app.get('/api/config', (req, res) => {
    res.json({ firebaseConfig: firebaseWebConfig, appUrl: APP_URL, adminId: ADMIN_ID, ownerWallet: OWNER_WALLET });
});

// ✅ GET USER - الإصدار المعدل
app.get('/api/users/:userId', async (req, res) => {
    if (!db) return res.json({ success: false, error: 'Database not connected' });
    try {
        const doc = await db.collection('users').doc(req.params.userId).get();
        res.json({ success: true, data: doc.exists ? doc.data() : null });
    } catch (error) {
        console.error('GET user error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ✅ CREATE USER - الإصدار المعدل (الأهم!)
app.post('/api/users', async (req, res) => {
    if (!db) return res.json({ success: false, error: 'Database not connected' });
    
    try {
        const { userId, userData } = req.body;
        
        console.log('📝 Creating user:', userId);
        console.log('📦 User data:', JSON.stringify(userData, null, 2));
        
        if (!userId) {
            return res.status(400).json({ success: false, error: 'Missing userId' });
        }
        
        // إضافة timestamps
        userData.createdAt = admin.firestore.FieldValue.serverTimestamp();
        userData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        
        // حفظ في Firebase
        await db.collection('users').doc(userId).set(userData);
        
        console.log('✅ User created successfully:', userId);
        
        res.json({ success: true, userId });
        
    } catch (error) {
        console.error('❌ Create user error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PATCH USER
app.patch('/api/users/:userId', async (req, res) => {
    if (!db) return res.json({ success: false });
    try {
        const { updates } = req.body;
        updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        await db.collection('users').doc(req.params.userId).update(updates);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// REFERRAL
app.post('/api/referral', async (req, res) => {
    if (!db) return res.json({ success: true });
    try {
        const { referrerId, newUserId } = req.body;
        if (!referrerId || !newUserId || referrerId === newUserId) {
            return res.json({ success: false });
        }
        
        const referrerRef = db.collection('users').doc(referrerId);
        const referrerDoc = await referrerRef.get();
        
        if (referrerDoc.exists) {
            const data = referrerDoc.data();
            if (!data.referrals?.includes(newUserId)) {
                await referrerRef.update({
                    referrals: admin.firestore.FieldValue.arrayUnion(newUserId),
                    inviteCount: admin.firestore.FieldValue.increment(1),
                    'balances.TROLL': admin.firestore.FieldValue.increment(500),
                    totalEarned: admin.firestore.FieldValue.increment(500)
                });
                
                bot.telegram.sendMessage(referrerId, `🧌 *New Troll!* +500 TROLL`, { parse_mode: 'Markdown' });
            }
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// CLAIM MILESTONE
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
            }
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// WITHDRAWAL STATUS
app.get('/api/withdrawal-status/:userId', async (req, res) => {
    if (!db) return res.json({ canWithdraw: false, missions: [] });
    try {
        const userDoc = await db.collection('users').doc(req.params.userId).get();
        if (!userDoc.exists) return res.json({ canWithdraw: false, missions: [] });
        
        const user = userDoc.data();
        
        if (user.premium) {
            return res.json({ canWithdraw: true, unlockedBy: 'premium', missions: [] });
        }
        
        const inviteCount = user.inviteCount || 0;
        const trollBalance = user.balances?.TROLL || 0;
        
        const missions = [
            { id: 'referrals', requirement: 12, current: inviteCount, completed: inviteCount >= 12, progress: Math.min((inviteCount / 12) * 100, 100) },
            { id: 'balance', requirement: 15000, current: trollBalance, completed: trollBalance >= 15000, progress: Math.min((trollBalance / 15000) * 100, 100) },
            { id: 'bnb', requirement: 0.02, current: user.externalBalances?.BNB || 0, completed: (user.externalBalances?.BNB || 0) >= 0.02, progress: Math.min(((user.externalBalances?.BNB || 0) / 0.02) * 100, 100) }
        ];
        
        const allCompleted = missions.every(m => m.completed);
        
        res.json({ canWithdraw: allCompleted, missions });
    } catch (error) {
        res.status(500).json({ canWithdraw: false, missions: [] });
    }
});

// DEPOSIT ADDRESS
app.post('/api/deposit-address', async (req, res) => {
    const { userId, currency } = req.body;
    const prefixes = { SOL: 'So1', BNB: '0x', ETH: '0x', TRON: 'T', TROLL: '0x' };
    const address = `${prefixes[currency] || ''}${userId.slice(-40).padStart(40, '0')}`;
    res.json({ success: true, address });
});

// BUY PREMIUM
app.post('/api/buy-premium', async (req, res) => {
    if (!db) return res.json({ success: true });
    try {
        const { userId } = req.body;
        await db.collection('users').doc(userId).update({
            premium: true,
            avatar: '😏',
            withdrawalUnlocked: true,
            premiumPurchasedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        bot.telegram.sendMessage(userId, `😏 *Premium Unlocked!*`, { parse_mode: 'Markdown' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// Serve Frontend
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Start Server
app.listen(PORT, () => {
    console.log(`🧌 Server running on port ${PORT}`);
    console.log(`🔥 Firebase: ${db ? 'Connected' : 'Disconnected'}`);
    console.log(`👑 Admin: ${ADMIN_ID}`);
});
