const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const crypto = require('crypto');
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
    console.log('🔑 Public Key:', COINPAYMENTS_PUBLIC ? COINPAYMENTS_PUBLIC.substring(0, 10) + '...' : 'Missing');
    console.log('🔐 Private Key:', COINPAYMENTS_PRIVATE ? 'Loaded (hidden)' : 'Missing');
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
        withdrawBlocked: false,
        claimedMilestones: [],
        tonWallet: null,
        settings: { solanaWallet: null },
        withdrawalMissions: getDefaultMissions(),
        notifications: [{
            id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5),
            type: 'welcome',
            title: '🎉 Welcome!',
            message: `Welcome! +${WELCOME_BONUS} TROLL bonus!`,
            read: false,
            timestamp: new Date().toISOString()
        }],
        transactions: []
    };
}

function getMinDeposit(currency) {
    const minimums = { SOL: 0.01, BNB: 0.01, ETH: 0.01, TRX: 10 };
    return minimums[currency] || 0.01;
}

function isAdmin(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        console.log('❌ No Authorization header');
        return false;
    }
    const isValid = authHeader === `Bearer ${ADMIN_PASSWORD}`;
    if (!isValid) {
        console.log('❌ Invalid admin password');
    }
    return isValid;
}

// ====== COINPAYMENTS - تم تصحيح أسماء العملات ======
async function generateCoinPaymentsAddress(userId, currency) {
    if (!COINPAYMENTS_PUBLIC || !COINPAYMENTS_PRIVATE) {
        console.log('⚠️ CoinPayments keys not configured');
        return null;
    }
    
    try {
        // 🔥 تحويل العملة إلى الصيغة الصحيحة التي يفهمها CoinPayments
        const cpCurrency = currency === 'BNB' ? 'BNB.BSC' :    // BNB على شبكة BSC
                          currency === 'SOL' ? 'SOL' :        // Solana Native
                          currency === 'ETH' ? 'ETH' :        // Ethereum
                          currency === 'TRX' ? 'TRX' : currency; // TRON
        
        console.log(`🔄 Generating callback address for ${userId} with currency ${cpCurrency}`);
        
        // 1. تجميع البيانات في كائن
        const postData = {
            key: COINPAYMENTS_PUBLIC,
            version: '1',
            cmd: 'get_callback_address',
            currency: cpCurrency,
            label: userId,
            format: 'json'
        };
        
        // 2. بناء Query String باستخدام URLSearchParams (ترتيب أبجدي + ترميز + بدون & زائدة)
        const postString = new URLSearchParams(postData).toString();
        console.log('📝 Post String for HMAC:', postString);
        
        // 3. حساب HMAC SHA512
        const hmac = crypto.createHmac('sha512', COINPAYMENTS_PRIVATE);
        hmac.update(postString);
        const signature = hmac.digest('hex');
        console.log('🔐 HMAC Signature generated');
        
        // 4. الإرسال باستخدام نفس الـ string تماماً
        const response = await fetch('https://www.coinpayments.net/api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'HMAC': signature
            },
            body: postString
        });
        
        const data = await response.json();
        console.log('📥 CoinPayments response:', JSON.stringify(data));
        
        if (data.error === 'ok') {
            console.log(`✅ CoinPayments callback address generated for ${userId}: ${data.result.address}`);
            return data.result.address;
        }
        
        console.log('❌ CoinPayments error:', data.error);
        return null;
        
    } catch (error) {
        console.error('❌ CoinPayments API error:', error);
        return null;
    }
}

// ====== إرسال إشعار لمستخدم ======
async function sendNotification(targetUserId, notification) {
    if (!db) return false;
    
    try {
        const notifData = {
            id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5),
            type: notification.type || 'info',
            title: notification.title || 'Notification',
            message: notification.message,
            read: false,
            timestamp: new Date().toISOString()
        };
        
        await db.collection('users').doc(targetUserId).update({
            notifications: admin.firestore.FieldValue.arrayUnion(notifData)
        });
        
        console.log(`✅ Notification sent to ${targetUserId}: ${notification.title}`);
        return true;
    } catch (error) {
        console.error('❌ Error sending notification:', error);
        return false;
    }
}

// ====== إرسال بث لجميع المستخدمين (عبر الإشعارات وليس رسائل البوت فقط) ======
async function broadcastToAllUsers(message, target = 'all') {
    if (!db) return { success: false, error: 'Database not connected' };
    
    try {
        // حفظ البث في قاعدة البيانات
        const broadcastRef = await db.collection('broadcasts').add({
            message: message,
            target: target,
            sentBy: 'admin',
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            readBy: []
        });
        
        console.log(`✅ Broadcast saved: ${broadcastRef.id}`);
        
        // إضافة الإشعار لكل المستخدمين في الـ notifications array
        const usersSnapshot = await db.collection('users').get();
        let notifiedCount = 0;
        
        // استخدام batch للكتابة بكفاءة (كل 500 مستخدم)
        let batch = db.batch();
        let batchCount = 0;
        
        const notification = {
            id: `broadcast_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            type: 'broadcast',
            title: '📢 Announcement',
            message: message,
            read: false,
            timestamp: new Date().toISOString()
        };
        
        for (const doc of usersSnapshot.docs) {
            const userRef = db.collection('users').doc(doc.id);
            batch.update(userRef, {
                notifications: admin.firestore.FieldValue.arrayUnion(notification)
            });
            notifiedCount++;
            batchCount++;
            
            // Firestore batch limit is 500
            if (batchCount >= 400) {
                await batch.commit();
                console.log(`📦 Batch committed: ${notifiedCount} users processed`);
                batch = db.batch();
                batchCount = 0;
                // انتظار بسيط لتجنب الضغط على Firestore
                await new Promise(r => setTimeout(r, 100));
            }
        }
        
        // الـ batch الأخير
        if (batchCount > 0) {
            await batch.commit();
            console.log(`📦 Final batch committed: total ${notifiedCount} users`);
        }
        
        console.log(`📢 Broadcast notification added to ${notifiedCount} users' notification centers`);
        
        // إرسال للبوت إذا كان الهدف يشمل البوت (اختياري)
        let botSentCount = 0;
        if (target === 'all' || target === 'bot') {
            for (const doc of usersSnapshot.docs) {
                try {
                    await bot.telegram.sendMessage(doc.id, `📢 *Announcement*\n\n${message}`, { parse_mode: 'Markdown' });
                    botSentCount++;
                    if (botSentCount % 30 === 0) {
                        await new Promise(r => setTimeout(r, 2000));
                    } else {
                        await new Promise(r => setTimeout(r, 50));
                    }
                } catch (e) {
                    // المستخدم قد يكون حظر البوت
                }
            }
            console.log(`📢 Bot broadcast sent to ${botSentCount} users`);
        }
        
        return { 
            success: true, 
            broadcastId: broadcastRef.id, 
            notifiedCount,
            botSentCount 
        };
        
    } catch (error) {
        console.error('❌ Broadcast error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================
// 🤖 Telegram Bot Setup
// ============================================================
const bot = new Telegraf(BOT_TOKEN);
const welcomeCache = new Map();
const botAdminSessions = new Map();

// دالة إرسال رسالة الترحيب (تُستخدم في /start وعند الدخول من رابط الإحالة)
async function sendWelcomeMessage(ctx, userId, userName, isNewUser = false) {
    // قيمة TROLL بالدولار (نفس القيمة المستخدمة في التطبيق)
    const TROLL_PRICE = 0.015; // 1000 TROLL = $15
    
    let welcomeBonusText = '';
    if (isNewUser) {
        welcomeBonusText = `\n🎁 Welcome Bonus: *${WELCOME_BONUS} TROLL* ~$${(WELCOME_BONUS * TROLL_PRICE).toFixed(0)}`;
    }
    
    const referralBonusValue = (REFERRAL_BONUS * TROLL_PRICE).toFixed(1);
    
    await ctx.reply(
        `🧌 *Welcome to Troll Army, ${userName}!*${welcomeBonusText}\n\n` +
        `👥 Referral Bonus: *${REFERRAL_BONUS} TROLL* ~$${referralBonusValue}\n\n` +
        `🔮 *4 Mystery Missions*\n` +
        `Complete them to unlock FREE & INSTANT withdrawals!\n` +
        `Trade TROLL on centralized exchanges!\n\n` +
        `👇 *Choose an option:*`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📢 Official Channel', url: 'https://t.me/troll_io' }],
                    [{ text: '👥 Community Group', url: 'https://t.me/TROLL_sol' }],
                    [{ text: '📊 CoinMarketCap', url: 'https://coinmarketcap.com/currencies/troll-sol' }],
                    [{ text: '🧌 Open Troll Wallet', web_app: { url: APP_URL } }]
                ]
            }
        }
    );
}

bot.start(async (ctx) => {
    const refCode = ctx.startPayload;
    const userId = ctx.from.id.toString();
    const userName = ctx.from.first_name || 'Troll';
    const userUsername = ctx.from.username || '';
    
    console.log(`🚀 /start command from ${userId} (${userName}), ref: ${refCode || 'none'}`);
    
    const cacheKey = `${userId}_welcome`;
    const now = Date.now();
    if (welcomeCache.has(cacheKey) && (now - welcomeCache.get(cacheKey)) < 5000) {
        console.log(`⏭️ Skipping duplicate welcome for ${userId}`);
        return;
    }
    welcomeCache.set(cacheKey, now);
    
    let isNewUser = false;
    
    if (db) {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            isNewUser = true;
            const userData = createNewUserData(userId, userName, userUsername, refCode);
            await userRef.set(userData);
            console.log(`✅ New user created via bot: ${userId}`);
            
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
                        
                        await sendNotification(refCode, {
                            type: 'referral',
                            title: '🧌 New Troll Recruited!',
                            message: `+${REFERRAL_BONUS} TROLL\nTotal Trolls: ${(referrerData.inviteCount || 0) + 1}`
                        });
                        
                        bot.telegram.sendMessage(refCode, 
                            `🧌 *New Troll Recruited!*\n\n+${REFERRAL_BONUS} TROLL\nTotal Trolls: ${(referrerData.inviteCount || 0) + 1}`, 
                            { parse_mode: 'Markdown' }
                        ).catch(() => {});
                        
                        console.log(`✅ Referral processed: ${refCode} referred ${userId}`);
                    }
                }
            }
        } else {
            console.log(`✅ Existing user: ${userId}`);
        }
    }
    
    // إرسال رسالة الترحيب (سواء كان مستخدم جديد أو قديم)
    await sendWelcomeMessage(ctx, userId, userName, isNewUser);
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

// ====== ADMIN AUTHENTICATION FOR BOT ======
bot.command('adminpro', async (ctx) => {
    const userId = ctx.from.id.toString();
    if (userId !== ADMIN_ID) {
        return ctx.reply('⛔ Not authorized!');
    }
    
    ctx.reply('🔐 Please enter the admin password:');
    botAdminSessions.set(userId, { step: 'awaiting_password' });
});

bot.on('text', async (ctx) => {
    const userId = ctx.from.id.toString();
    const session = botAdminSessions.get(userId);
    
    if (!session) return;
    
    const text = ctx.message.text;
    
    if (session.step === 'awaiting_password') {
        if (text === ADMIN_PASSWORD) {
            botAdminSessions.set(userId, { step: 'authenticated' });
            ctx.reply(
                '✅ *Authentication Successful!*\n\n' +
                'You can now use:\n' +
                '• `/broadcast` - Send message to all users\n' +
                '• `/botstats` - View bot statistics',
                { parse_mode: 'Markdown' }
            );
        } else {
            ctx.reply('❌ Wrong password!');
            botAdminSessions.delete(userId);
        }
        return;
    }
    
    if (session.step === 'authenticated') {
        if (text === '/broadcast') {
            ctx.reply('📝 Send me the message you want to broadcast:');
            botAdminSessions.set(userId, { step: 'awaiting_broadcast' });
        } else if (text === '/botstats') {
            const stats = await getBotStats();
            ctx.reply(stats, { parse_mode: 'Markdown' });
        } else {
            ctx.reply('Available commands:\n/broadcast - Send broadcast\n/botstats - View statistics');
        }
        return;
    }
    
    if (session.step === 'awaiting_broadcast') {
        ctx.reply('📢 Broadcasting to all users...');
        
        const result = await broadcastToAllUsers(text, 'all');
        
        if (result.success) {
            ctx.reply(`✅ *Broadcast Complete!*\n\n📊 Notification added for: ${result.notifiedCount} users\n📨 Bot messages sent: ${result.botSentCount || 0}`, { parse_mode: 'Markdown' });
        } else {
            ctx.reply('❌ Error sending broadcast');
        }
        
        botAdminSessions.delete(userId);
    }
});

async function getBotStats() {
    if (!db) return 'Database not connected';
    
    const usersSnapshot = await db.collection('users').get();
    const pendingWithdrawals = await db.collection('withdrawals').where('status', '==', 'pending').get();
    const pendingDeposits = await db.collection('deposit_requests').where('status', '==', 'pending').get();
    
    return `📊 *Bot Statistics*\n\n` +
        `👥 Total Users: ${usersSnapshot.size}\n` +
        `💸 Pending Withdrawals: ${pendingWithdrawals.size}\n` +
        `📥 Pending Deposits: ${pendingDeposits.size}\n` +
        `🕐 Uptime: ${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`;
}

// عند الدخول من رابط الإحالة عبر التطبيق (بدون /start)
bot.on('message', async (ctx) => {
    // نتأكد أن الرسالة ليست أمراً
    if (ctx.message.text && ctx.message.text.startsWith('/')) return;
    
    const userId = ctx.from.id.toString();
    const userName = ctx.from.first_name || 'Troll';
    
    // التحقق إذا كان المستخدم جديداً ونريد إرسال رسالة ترحيب
    console.log(`📨 Message from ${userId}: ${ctx.message.text || '[non-text]'}`);
});

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
        botLink: 'https://t.me/TROLLMiniappbot/instant',
        supportUsername: 'Troll_Customer_Support'
    });
});

// ====== ADMIN VERIFY (للتحقق من كلمة المرور فقط) ======
app.post('/api/admin/verify', (req, res) => {
    const { password } = req.body;
    
    if (!password) {
        return res.json({ success: false, error: 'Password required' });
    }
    
    if (password === ADMIN_PASSWORD) {
        console.log('✅ Admin verified successfully');
        res.json({ success: true, message: 'Authenticated' });
    } else {
        console.log('❌ Admin verification failed: invalid password');
        res.json({ success: false, error: 'Invalid password' });
    }
});

// ====== INIT USER ======
app.post('/api/init-user', async (req, res) => {
    try {
        const { initData } = req.body;
        if (!initData) return res.json({ success: false, error: 'No initData' });
        
        const params = new URLSearchParams(initData);
        const userJson = params.get('user');
        if (!userJson) return res.json({ success: false, error: 'No user data' });
        
        const user = JSON.parse(decodeURIComponent(userJson));
        const userId = user.id.toString();
        const userName = user.first_name || 'Troll';
        const userUsername = user.username || '';
        
        console.log('📱 Init user:', userId, userName);
        
        if (!db) return res.json({ success: false, error: 'Database not connected' });
        
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
        if (!userId || !userData) return res.status(400).json({ success: false, error: 'Missing data' });
        
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (userDoc.exists) return res.json({ success: true, message: 'User already exists' });
        
        await userRef.set({ ...userData, createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
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
        await db.collection('users').doc(req.params.userId).update({ ...updates, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
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
        if (!referrerId || !newUserId || referrerId === newUserId) return res.json({ success: false, error: 'Invalid data' });
        
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
                
                await sendNotification(referrerId, {
                    type: 'referral',
                    title: '🧌 New Troll!',
                    message: `+${REFERRAL_BONUS} TROLL from referral!`
                });
                
                bot.telegram.sendMessage(referrerId, `🧌 *New Troll!* +${REFERRAL_BONUS} TROLL`, { parse_mode: 'Markdown' }).catch(() => {});
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
                
                await sendNotification(userId, {
                    type: 'milestone',
                    title: '🏆 Milestone Achieved!',
                    message: `+${reward.toLocaleString()} TROLL claimed!`
                });
                
                bot.telegram.sendMessage(userId, `🎉 *Milestone!* +${reward.toLocaleString()} TROLL`, { parse_mode: 'Markdown' }).catch(() => {});
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
        await db.collection('users').doc(userId).update({
            premium: true,
            avatar: '😏',
            withdrawalUnlocked: true,
            premiumTxHash: txHash,
            premiumPurchasedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        await sendNotification(userId, {
            type: 'premium',
            title: '👑 Premium Unlocked!',
            message: 'You now have instant withdrawal access and exclusive avatar!'
        });
        
        bot.telegram.sendMessage(userId, `😏 *Premium Unlocked!*`, { parse_mode: 'Markdown' }).catch(() => {});
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ====== DEPOSIT API ======
app.post('/api/deposit/generate', async (req, res) => {
    console.log('📥 Deposit generate called:', req.body);
    try {
        const { userId, userName, currency } = req.body;
        
        const supportedCurrencies = ['BNB', 'SOL', 'ETH', 'TRX'];
        if (!supportedCurrencies.includes(currency)) {
            console.log('❌ Currency not supported:', currency);
            return res.json({ 
                success: false, 
                error: `${currency} is not supported. Please use BNB, SOL, ETH, or TRX.` 
            });
        }
        
        if (!db) {
            console.log('⚠️ No database');
            return res.json({ success: false, error: 'Database not connected' });
        }
        
        // التحقق من وجود عنوان سابق في قاعدة البيانات
        const existingSnapshot = await db.collection('deposit_addresses')
            .where('userId', '==', userId)
            .where('currency', '==', currency)
            .limit(1)
            .get();
        
        if (!existingSnapshot.empty) {
            const addr = existingSnapshot.docs[0].data();
            console.log('📦 Returning existing address from database:', addr.address);
            return res.json({ 
                success: true, 
                address: addr.address, 
                network: addr.network, 
                minDeposit: getMinDeposit(currency) 
            });
        }
        
        console.log('🆕 Calling CoinPayments for', userId, currency);
        
        // استدعاء CoinPayments API
        const address = await generateCoinPaymentsAddress(userId, currency);
        
        if (!address) {
            console.log('❌ CoinPayments failed to generate address');
            return res.json({ 
                success: false, 
                error: 'Failed to generate address. Please try again later.' 
            });
        }
        
        const network = currency === 'SOL' ? 'Solana' : (currency === 'TRX' ? 'TRON' : 'BSC/BEP-20');
        
        // حفظ العنوان في قاعدة البيانات
        await db.collection('deposit_addresses').add({
            userId, 
            userName, 
            currency, 
            address, 
            network,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ New address saved to database:', address);
        res.json({ 
            success: true, 
            address, 
            network, 
            minDeposit: getMinDeposit(currency) 
        });
    } catch (error) {
        console.error('❌ Deposit generate error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ====== SUBMIT DEPOSIT REQUEST ======
app.post('/api/deposit/submit-request', async (req, res) => {
    if (!db) return res.json({ success: false, error: 'Database not connected' });
    
    try {
        const { userId, userName, currency, amount, address, txnId } = req.body;
        
        if (!userId || !currency || !address) {
            return res.json({ success: false, error: 'Missing required fields' });
        }
        
        const depositRequest = {
            userId,
            userName,
            currency,
            amount: amount || 0,
            address,
            txnId: txnId || null,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        const docRef = await db.collection('deposit_requests').add(depositRequest);
        
        // إرسال إشعار للمشرف
        await sendNotification(ADMIN_ID, {
            type: 'deposit',
            title: '📥 New Deposit Request',
            message: `${userName} wants to deposit ${amount || '?'} ${currency}`
        });
        
        bot.telegram.sendMessage(ADMIN_ID, 
            `📥 *New Deposit Request*\n\n` +
            `👤 ${userName} (${userId})\n` +
            `💰 Amount: ${amount || 'Not specified'} ${currency}\n` +
            `📮 ${address}\n` +
            `🔗 TXID: ${txnId || 'N/A'}`,
            { parse_mode: 'Markdown' }
        ).catch(() => {});
        
        console.log('✅ Deposit request saved:', docRef.id);
        res.json({ success: true, requestId: docRef.id });
        
    } catch (error) {
        console.error('❌ Deposit request error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ====== WITHDRAW API ======
app.post('/api/withdraw/request', async (req, res) => {
    console.log('📤 Withdraw request called:', req.body);
    if (!db) return res.json({ success: true, mock: true });
    try {
        const { userId, userName, currency, amount, address } = req.body;
        
        if (!userId || !amount || !address) {
            return res.json({ success: false, error: 'Missing required fields' });
        }
        
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            return res.json({ success: false, error: 'User not found' });
        }
        
        const userData = userDoc.data();
        
        if (userData.withdrawBlocked) {
            return res.json({ success: false, error: 'Withdrawals permanently blocked' });
        }
        
        if (!userData.withdrawalUnlocked && !userData.premium) {
            return res.json({ success: false, error: 'Withdrawal locked' });
        }
        
        if ((userData.balances[currency] || 0) < amount) {
            return res.json({ success: false, error: 'Insufficient balance' });
        }
        
        const withdrawRequest = {
            userId, userName, currency, amount, address,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        const docRef = await db.collection('withdrawals').add(withdrawRequest);
        
        await userRef.update({
            [`balances.${currency}`]: admin.firestore.FieldValue.increment(-amount),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        const transaction = {
            userId, userName,
            type: 'withdraw',
            currency, amount,
            status: 'pending',
            timestamp: new Date().toISOString(),
            firebaseId: docRef.id,
            address
        };
        
        await db.collection('transactions').add(transaction);
        
        await sendNotification(userId, {
            type: 'withdraw',
            title: '💸 Withdrawal Requested',
            message: `Your withdrawal of ${amount} ${currency} is being processed.`
        });
        
        bot.telegram.sendMessage(ADMIN_ID, 
            `💸 *New Withdrawal Request*\n\n` +
            `👤 ${userName} (${userId})\n` +
            `💰 ${amount} ${currency}\n` +
            `📮 ${address}`,
            { parse_mode: 'Markdown' }
        ).catch(() => {});
        
        console.log('✅ Withdrawal request saved:', docRef.id);
        res.json({ success: true, requestId: docRef.id });
    } catch (error) {
        console.error('❌ Withdraw error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ====== ADMIN APIs ======

// البحث عن مستخدم بواسطة عنوان المحفظة
app.post('/api/admin/search-by-wallet', async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Unauthorized' });
    try {
        const { walletAddress } = req.body;
        const snapshot = await db.collection('deposit_addresses').where('address', '==', walletAddress).limit(1).get();
        if (snapshot.empty) return res.json({ success: false, error: 'Wallet not found' });
        const addrData = snapshot.docs[0].data();
        const userDoc = await db.collection('users').doc(addrData.userId).get();
        if (!userDoc.exists) return res.json({ success: false, error: 'User not found' });
        res.json({ success: true, user: userDoc.data() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// إضافة رصيد
app.post('/api/admin/add-balance', async (req, res) => {
    if (!isAdmin(req)) {
        console.log('❌ Unauthorized add-balance attempt');
        return res.status(403).json({ error: 'Unauthorized' });
    }
    if (!db) return res.json({ success: true, mock: true });
    try {
        const { userId, currency, amount } = req.body;
        console.log(`💰 Admin adding balance: ${userId} - ${amount} ${currency}`);
        
        await db.collection('users').doc(userId).update({ 
            [`balances.${currency}`]: admin.firestore.FieldValue.increment(amount) 
        });
        
        const transaction = {
            userId, userName: 'Admin',
            type: 'admin_add',
            currency, amount,
            status: 'completed',
            timestamp: new Date().toISOString(),
            details: `Admin added balance`
        };
        await db.collection('transactions').add(transaction);
        
        await sendNotification(userId, {
            type: 'admin_add',
            title: '💰 Balance Added',
            message: `Admin added ${amount} ${currency} to your account.`
        });
        
        bot.telegram.sendMessage(userId, `💰 *Admin added ${amount} ${currency}*`, { parse_mode: 'Markdown' }).catch(() => {});
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Add balance error:', error);
        res.status(500).json({ error: error.message });
    }
});

// خصم رصيد
app.post('/api/admin/remove-balance', async (req, res) => {
    if (!isAdmin(req)) {
        console.log('❌ Unauthorized remove-balance attempt');
        return res.status(403).json({ error: 'Unauthorized' });
    }
    if (!db) return res.json({ success: true, mock: true });
    try {
        const { userId, currency, amount } = req.body;
        console.log(`💰 Admin removing balance: ${userId} - ${amount} ${currency}`);
        
        await db.collection('users').doc(userId).update({ 
            [`balances.${currency}`]: admin.firestore.FieldValue.increment(-amount) 
        });
        
        const transaction = {
            userId, userName: 'Admin',
            type: 'admin_remove',
            currency, amount,
            status: 'completed',
            timestamp: new Date().toISOString(),
            details: `Admin removed balance`
        };
        await db.collection('transactions').add(transaction);
        
        await sendNotification(userId, {
            type: 'admin_remove',
            title: '💰 Balance Adjusted',
            message: `Admin removed ${amount} ${currency} from your account.`
        });
        
        bot.telegram.sendMessage(userId, `💰 *Admin removed ${amount} ${currency}*`, { parse_mode: 'Markdown' }).catch(() => {});
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Remove balance error:', error);
        res.status(500).json({ error: error.message });
    }
});

// حظر المستخدم من السحب (دائم)
app.post('/api/admin/block-user', async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Unauthorized' });
    if (!db) return res.json({ success: false, error: 'Database not connected' });
    
    try {
        const { userId } = req.body;
        console.log(`🚫 Admin blocking user: ${userId}`);
        
        await db.collection('users').doc(userId).update({
            withdrawBlocked: true,
            withdrawBlockedAt: admin.firestore.FieldValue.serverTimestamp(),
            withdrawBlockedBy: 'admin',
            withdrawBlockedPermanent: true
        });
        
        await sendNotification(userId, {
            type: 'blocked',
            title: '🚫 Account Restricted',
            message: 'Your withdrawal access has been permanently blocked. Contact support for more information.'
        });
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// بث رسالة (يعمل الآن عبر الإشعارات)
app.post('/api/admin/broadcast', async (req, res) => {
    console.log('📢 Broadcast API called');
    
    if (!isAdmin(req)) {
        console.log('❌ Unauthorized - Invalid admin password');
        return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    
    try {
        const { message, target } = req.body;
        
        if (!message) {
            return res.json({ success: false, error: 'No message provided' });
        }
        
        console.log(`📢 Broadcasting message (target: ${target || 'all'}): ${message.substring(0, 50)}...`);
        
        const result = await broadcastToAllUsers(message, target || 'all');
        res.json(result);
        
    } catch (error) {
        console.error('❌ Broadcast error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// إحصائيات المشرف
app.get('/api/admin/stats', async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Unauthorized' });
    if (!db) return res.json({ success: false });
    try {
        const usersSnapshot = await db.collection('users').get();
        const pendingWithdrawals = await db.collection('withdrawals').where('status', '==', 'pending').get();
        const pendingDeposits = await db.collection('deposit_requests').where('status', '==', 'pending').get();
        const premiumUsers = await db.collection('users').where('premium', '==', true).get();
        
        res.json({
            success: true,
            stats: {
                totalUsers: usersSnapshot.size,
                pendingWithdrawals: pendingWithdrawals.size,
                pendingDeposits: pendingDeposits.size,
                premiumUsers: premiumUsers.size
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// الحصول على طلبات السحب المعلقة
app.get('/api/admin/pending-withdrawals', async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Unauthorized' });
    if (!db) return res.json({ success: false, withdrawals: [] });
    
    try {
        const snapshot = await db.collection('withdrawals')
            .where('status', '==', 'pending')
            .orderBy('createdAt', 'desc')
            .get();
        
        const withdrawals = [];
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const userDoc = await db.collection('users').doc(data.userId).get();
            const userData = userDoc.exists ? userDoc.data() : null;
            
            withdrawals.push({
                id: doc.id,
                ...data,
                user: userData ? {
                    userName: userData.userName,
                    inviteCount: userData.inviteCount || 0
                } : null
            });
        }
        
        res.json({ success: true, withdrawals });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// الحصول على طلبات الإيداع المعلقة
app.get('/api/admin/pending-deposits', async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Unauthorized' });
    if (!db) return res.json({ success: false, deposits: [] });
    
    try {
        const snapshot = await db.collection('deposit_requests')
            .where('status', '==', 'pending')
            .orderBy('createdAt', 'desc')
            .get();
        
        const deposits = [];
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const userDoc = await db.collection('users').doc(data.userId).get();
            const userData = userDoc.exists ? userDoc.data() : null;
            
            deposits.push({
                id: doc.id,
                ...data,
                user: userData ? {
                    userName: userData.userName,
                    inviteCount: userData.inviteCount || 0
                } : null
            });
        }
        
        res.json({ success: true, deposits });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// الموافقة على طلب إيداع
app.post('/api/admin/approve-deposit', async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Unauthorized' });
    if (!db) return res.json({ success: false, error: 'Database not connected' });
    
    try {
        const { depositId } = req.body;
        
        const depositRef = db.collection('deposit_requests').doc(depositId);
        const depositDoc = await depositRef.get();
        
        if (!depositDoc.exists) {
            return res.json({ success: false, error: 'Deposit not found' });
        }
        
        const data = depositDoc.data();
        console.log(`✅ Approving deposit: ${depositId} - ${data.amount} ${data.currency} for ${data.userId}`);
        
        // إضافة الرصيد للمستخدم
        await db.collection('users').doc(data.userId).update({
            [`balances.${data.currency}`]: admin.firestore.FieldValue.increment(data.amount)
        });
        
        await depositRef.update({
            status: 'approved',
            approvedAt: admin.firestore.FieldValue.serverTimestamp(),
            approvedBy: 'admin'
        });
        
        // إضافة للمعاملات
        await db.collection('transactions').add({
            userId: data.userId,
            userName: data.userName,
            type: 'deposit',
            currency: data.currency,
            amount: data.amount,
            status: 'completed',
            timestamp: new Date().toISOString(),
            address: data.address
        });
        
        await sendNotification(data.userId, {
            type: 'deposit',
            title: '✅ Deposit Approved!',
            message: `Your deposit of ${data.amount} ${data.currency} has been approved and added to your balance.`
        });
        
        bot.telegram.sendMessage(
            data.userId,
            `✅ *Deposit Approved!*\n\nYour deposit of ${data.amount} ${data.currency} has been approved.`,
            { parse_mode: 'Markdown' }
        ).catch(() => {});
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// رفض طلب إيداع
app.post('/api/admin/reject-deposit', async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Unauthorized' });
    if (!db) return res.json({ success: false, error: 'Database not connected' });
    
    try {
        const { depositId, reason } = req.body;
        
        const depositRef = db.collection('deposit_requests').doc(depositId);
        const depositDoc = await depositRef.get();
        
        if (!depositDoc.exists) {
            return res.json({ success: false, error: 'Deposit not found' });
        }
        
        const data = depositDoc.data();
        console.log(`❌ Rejecting deposit: ${depositId} - Reason: ${reason}`);
        
        await depositRef.update({
            status: 'rejected',
            rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
            rejectedBy: 'admin',
            rejectReason: reason || 'No reason provided'
        });
        
        await sendNotification(data.userId, {
            type: 'deposit',
            title: '❌ Deposit Rejected',
            message: `Your deposit of ${data.amount} ${data.currency} was rejected. Reason: ${reason || 'Not specified'}`
        });
        
        bot.telegram.sendMessage(
            data.userId,
            `❌ *Deposit Rejected*\n\nYour deposit of ${data.amount} ${data.currency} was rejected.\nReason: ${reason || 'Not specified'}`,
            { parse_mode: 'Markdown' }
        ).catch(() => {});
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// الموافقة على طلب سحب
app.post('/api/admin/approve-withdrawal', async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Unauthorized' });
    if (!db) return res.json({ success: false, error: 'Database not connected' });
    
    try {
        const { withdrawalId } = req.body;
        
        const withdrawalRef = db.collection('withdrawals').doc(withdrawalId);
        const withdrawalDoc = await withdrawalRef.get();
        
        if (!withdrawalDoc.exists) {
            return res.json({ success: false, error: 'Withdrawal not found' });
        }
        
        const data = withdrawalDoc.data();
        console.log(`✅ Approving withdrawal: ${withdrawalId} - ${data.amount} ${data.currency} for ${data.userId}`);
        
        await withdrawalRef.update({
            status: 'approved',
            approvedAt: admin.firestore.FieldValue.serverTimestamp(),
            approvedBy: 'admin'
        });
        
        await sendNotification(data.userId, {
            type: 'withdraw',
            title: '✅ Withdrawal Approved!',
            message: `Your withdrawal of ${data.amount} ${data.currency} has been approved.`
        });
        
        bot.telegram.sendMessage(
            data.userId,
            `✅ *Withdrawal Approved!*\n\nYour withdrawal of ${data.amount} ${data.currency} has been approved.`,
            { parse_mode: 'Markdown' }
        ).catch(() => {});
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// رفض طلب سحب
app.post('/api/admin/reject-withdrawal', async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Unauthorized' });
    if (!db) return res.json({ success: false, error: 'Database not connected' });
    
    try {
        const { withdrawalId, reason } = req.body;
        
        const withdrawalRef = db.collection('withdrawals').doc(withdrawalId);
        const withdrawalDoc = await withdrawalRef.get();
        
        if (!withdrawalDoc.exists) {
            return res.json({ success: false, error: 'Withdrawal not found' });
        }
        
        const data = withdrawalDoc.data();
        console.log(`❌ Rejecting withdrawal: ${withdrawalId} - Reason: ${reason}`);
        
        // إعادة الرصيد للمستخدم
        const userRef = db.collection('users').doc(data.userId);
        await userRef.update({
            [`balances.${data.currency}`]: admin.firestore.FieldValue.increment(data.amount)
        });
        
        await withdrawalRef.update({
            status: 'rejected',
            rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
            rejectedBy: 'admin',
            rejectReason: reason || 'No reason provided'
        });
        
        await sendNotification(data.userId, {
            type: 'withdraw',
            title: '❌ Withdrawal Rejected',
            message: `Your withdrawal of ${data.amount} ${data.currency} was rejected. Reason: ${reason || 'Not specified'}\n\nThe amount has been returned to your balance.`
        });
        
        bot.telegram.sendMessage(
            data.userId,
            `❌ *Withdrawal Rejected*\n\nYour withdrawal of ${data.amount} ${data.currency} was rejected.\nReason: ${reason || 'Not specified'}\n\nThe amount has been returned.`,
            { parse_mode: 'Markdown' }
        ).catch(() => {});
        
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
    console.log(`\n🧌 Troll Army Server - PROFESSIONAL EDITION v29.0 (COIN NAMES FIXED)`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`🔥 Firebase: ${db ? '✅ Connected' : '❌ Disconnected'}`);
    console.log(`👑 Admin ID: ${ADMIN_ID || '❌ Not configured'}`);
    console.log(`🤖 Bot: ${BOT_TOKEN ? '✅ Configured' : '❌ Missing'}`);
    console.log(`💳 CoinPayments: ${COINPAYMENTS_PUBLIC ? '✅ Configured' : '❌ Missing'}`);
    console.log(`🌐 App URL: ${APP_URL}`);
    console.log(`\n✅ Server ready for production!\n`);
    console.log(`📢 Broadcast system: Works via notifications (not just bot messages)`);
    console.log(`💳 Deposit system: BNB=BNB.BSC, SOL=SOL, ETH=ETH, TRX=TRX`);
});
