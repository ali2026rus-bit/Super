// ============================================================================
// TROLL ARMY - MYSTERY MISSIONS SYSTEM v18.0 FINAL
// ============================================================================
// Architecture: Telegram-First User Detection + 4 Mystery Missions + 20-Day Timer
// Features: Referral System + Admin Panel + CoinGecko + TON Connect + Deposit/Withdraw
// ============================================================================

// ====== 1. TELEGRAM WEBAPP & USER DETECTION ======
(function() {
    window.TrollArmy = window.TrollArmy || {};
    
    const tg = window.Telegram?.WebApp;
    let userId = null;
    let userName = 'Troll';
    let userFirstName = 'Troll';
    let userLastName = '';
    let userUsername = '';
    let authMethod = 'none';
    let IS_GUEST = true;
    
    async function waitForTelegramUser(maxWaitMs = 5000) {
        if (!tg) {
            console.log("❌ No Telegram WebApp object");
            return null;
        }
        
        tg.ready();
        tg.expand();
        
        const startTime = Date.now();
        let attempts = 0;
        
        while (Date.now() - startTime < maxWaitMs) {
            attempts++;
            
            if (tg.initDataUnsafe?.user?.id) {
                const u = tg.initDataUnsafe.user;
                console.log(`✅ Telegram user found after ${attempts} attempts`);
                return {
                    id: u.id.toString(),
                    firstName: u.first_name || 'Troll',
                    lastName: u.last_name || '',
                    username: u.username || '',
                    method: 'telegram_initDataUnsafe'
                };
            }
            
            if (tg.initData) {
                try {
                    const params = new URLSearchParams(tg.initData);
                    const userJson = params.get('user');
                    if (userJson) {
                        const u = JSON.parse(decodeURIComponent(userJson));
                        if (u?.id) {
                            console.log(`✅ Telegram user found via initData`);
                            return {
                                id: u.id.toString(),
                                firstName: u.first_name || 'Troll',
                                lastName: u.last_name || '',
                                username: u.username || '',
                                method: 'telegram_initData'
                            };
                        }
                    }
                } catch(e) {}
            }
            
            await new Promise(r => setTimeout(r, 100));
        }
        
        console.log(`⚠️ Telegram timeout`);
        return null;
    }
    
    async function initUser() {
        console.log("🚀 Starting user detection (Telegram-first)...");
        
        const telegramUser = await waitForTelegramUser(5000);
        
        if (telegramUser) {
            userId = telegramUser.id;
            userName = telegramUser.firstName;
            userFirstName = telegramUser.firstName;
            userLastName = telegramUser.lastName;
            userUsername = telegramUser.username;
            authMethod = telegramUser.method;
            IS_GUEST = false;
            
            console.log("🎉 AUTHENTICATED:", userId);
            
            localStorage.setItem('troll_user_id', userId);
            localStorage.setItem('troll_user_name', userName);
            localStorage.setItem('troll_auth_method', authMethod);
            
        } else {
            const savedId = localStorage.getItem('troll_user_id');
            const savedMethod = localStorage.getItem('troll_auth_method');
            
            if (savedId && savedMethod?.startsWith('telegram_') && !savedId.startsWith('guest_')) {
                userId = savedId;
                userName = localStorage.getItem('troll_user_name') || 'Troll';
                authMethod = 'localStorage_restore';
                IS_GUEST = false;
                console.log("📦 Restored from localStorage:", userId);
            } else {
                userId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
                userName = 'Guest Troll';
                authMethod = 'guest';
                IS_GUEST = true;
                console.warn("🚫 GUEST MODE");
            }
        }
        
        window.TrollArmy.userId = userId;
        window.TrollArmy.userName = userName;
        window.TrollArmy.userFirstName = userFirstName;
        window.TrollArmy.userUsername = userUsername;
        window.TrollArmy.isGuest = IS_GUEST;
        window.TrollArmy.authMethod = authMethod;
        window.TrollArmy.hasTelegramWebApp = !!tg;
        
        console.log("=== FINAL USER ===", userId, "| Guest:", IS_GUEST);
        
        if (typeof loadUserData === 'function') {
            await loadUserData();
        }
        
        await processReferralFromUrl();
    }
    
    async function processReferralFromUrl() {
        if (IS_GUEST) return;
        
        const urlParams = new URLSearchParams(window.location.search);
        const startParam = urlParams.get('startapp') || urlParams.get('start') || urlParams.get('ref');
        
        if (startParam && startParam !== userId) {
            console.log("🔗 Referral detected:", startParam);
            window.TrollArmy.pendingReferral = startParam;
        }
    }
    
    initUser();
    console.log("✅ User Detection Ready");
})();

// ====== 2. CONFIGURATION ======
const CONFIG = {
    APP: {
        name: 'Troll Army',
        version: '18.0.0',
        botLink: 'https://t.me/TROLLMiniappbot/instant',
        adminId: null // من السيرفر
    },
    ECONOMY: {
        welcomeBonus: 1000,
        referralBonus: 500,
        trollPriceFallback: 0.01915
    },
    CACHE: {
        userTTL: 300000,
        pricesTTL: 10800000
    }
};

// ====== 3. MYSTERY MISSIONS CONFIG ======
const MYSTERY_MISSIONS = {
    mission1: {
        id: 'solana_wallet',
        title: { en: 'Mission 1: Connect Solana', ar: 'المهمة 1: ربط Solana' },
        description: { en: 'Add your TROLL Solana wallet', ar: 'أضف محفظة TROLL على Solana' },
        hint: { en: 'Go to Settings to add wallet', ar: 'اذهب للإعدادات لإضافة المحفظة' }
    },
    mission2: {
        id: 'referral_earnings',
        title: { en: 'Mission 2: Build Wealth', ar: 'المهمة 2: جمع الثروة' },
        description: { en: 'Earn 12,500 TROLL from referrals', ar: 'اربح 12,500 TROLL من الإحالات' },
        hint: { en: 'Each referral gives 500 TROLL', ar: 'كل إحالة تعطيك 500 TROLL' },
        required: 12500
    },
    mission3: {
        id: 'new_referrals',
        title: { en: 'Mission 3: Expand Army', ar: 'المهمة 3: توسيع الجيش' },
        description: { en: 'Get 12 NEW referrals', ar: 'اجلب 12 إحالة جديدة' },
        hint: { en: 'Only new referrals count', ar: 'الإحالات الجديدة فقط تحتسب' },
        required: 12
    },
    mission4: {
        id: 'holdings',
        title: { en: 'Mission 4: Prove Holdings', ar: 'المهمة 4: إثبات الملاءة' },
        description: { en: 'Hold 0.025 BNB or 0.25 SOL', ar: 'احتفظ بـ 0.025 BNB أو 0.25 SOL' },
        hint: { en: 'Deposit to your wallet', ar: 'أودع في محفظتك' },
        requiredBNB: 0.025,
        requiredSOL: 0.25
    }
};

// ====== 4. MILESTONES CONFIG ======
const REFERRAL_MILESTONES = [
    { referrals: 10, reward: 5000, title: { en: '🤡 Baby Troll', ar: '🤡 ترول صغير' } },
    { referrals: 25, reward: 12500, title: { en: '😈 Master Troll', ar: '😈 ترول محترف' } },
    { referrals: 100, reward: 25000, title: { en: '👹 Troll Lord', ar: '👹 لورد التصيد' } },
    { referrals: 250, reward: 50000, title: { en: '🧌 Troll King', ar: '🧌 ملك التصيد' } },
    { referrals: 500, reward: 100000, title: { en: '🔥 Troll God', ar: '🔥 إله التصيد' } },
    { referrals: 1000, reward: 0, title: { en: '💀 Grand Master', ar: '💀 المعلم الأكبر' }, isSpecial: true }
];

// ====== 5. ICONS & ASSETS ======
const ICONS = {
    TROLL: 'https://s2.coinmarketcap.com/static/img/coins/64x64/36313.png',
    SOL: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png',
    BNB: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png',
    ETH: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
    TRON: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1958.png',
    BTC: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png',
    DOGE: 'https://s2.coinmarketcap.com/static/img/coins/64x64/74.png',
    SHIB: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5994.png',
    PEPE: 'https://s2.coinmarketcap.com/static/img/coins/64x64/24478.png'
};

const ALL_ASSETS = [
    { symbol: 'TROLL', name: 'Troll Token' },
    { symbol: 'SOL', name: 'Solana' },
    { symbol: 'BNB', name: 'BNB' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'TRON', name: 'TRON' }
];

const TOP_CRYPTOS = [
    { symbol: 'TROLL', name: 'Troll Token', coingeckoId: 'troll-2' },
    { symbol: 'BTC', name: 'Bitcoin', coingeckoId: 'bitcoin' },
    { symbol: 'ETH', name: 'Ethereum', coingeckoId: 'ethereum' },
    { symbol: 'BNB', name: 'BNB', coingeckoId: 'binancecoin' },
    { symbol: 'SOL', name: 'Solana', coingeckoId: 'solana' }
];

const MEME_COINS = [
    { symbol: 'DOGE', name: 'Dogecoin', coingeckoId: 'dogecoin' },
    { symbol: 'SHIB', name: 'Shiba Inu', coingeckoId: 'shiba-inu' },
    { symbol: 'PEPE', name: 'Pepe', coingeckoId: 'pepe' }
];

// ====== 6. STATE MANAGEMENT ======
let appState = {
    user: null,
    prices: {},
    language: localStorage.getItem('language') || 'en',
    theme: localStorage.getItem('theme') || 'dark',
    currentPage: 'wallet',
    isInitialized: false,
    isAdmin: false
};

let userData = null;
let db = null;
let appConfig = {};
let tonConnectUI = null;
let tonConnected = false;
let tonWalletAddress = null;
let lastPricesFetch = 0;

// ====== 7. TRANSLATIONS ======
const LOCALES = {
    en: {
        'nav.wallet': 'Wallet', 'nav.airdrop': 'Missions', 'nav.settings': 'Settings',
        'actions.deposit': 'Deposit', 'actions.withdraw': 'Withdraw', 'actions.history': 'History',
        'wallet.totalBalance': 'Total Balance', 'airdrop.totalInvites': 'Total Invites',
        'airdrop.earned': 'TROLL Earned', 'airdrop.yourLink': 'Your Invite Link',
        'airdrop.milestones': 'Troll Ranks', 'mission.revealLater': 'Reveals after previous mission',
        'mission.waitDays': 'Reveals in {days} days', 'mission.completed': 'Completed',
        'withdrawal.unlocked': 'Withdrawal Unlocked!', 'premium.unlocked': 'Premium Unlocked!',
        'settings.language': 'Language', 'settings.theme': 'Theme', 'settings.logout': 'Logout',
        'admin.panel': 'Admin Panel', 'referral.bonus': 'Earn 500 TROLL per referral!'
    },
    ar: {
        'nav.wallet': 'المحفظة', 'nav.airdrop': 'المهام', 'nav.settings': 'الإعدادات',
        'actions.deposit': 'إيداع', 'actions.withdraw': 'سحب', 'actions.history': 'السجل',
        'wallet.totalBalance': 'الرصيد الإجمالي', 'airdrop.totalInvites': 'إجمالي الدعوات',
        'airdrop.earned': 'TROLL المكتسبة', 'airdrop.yourLink': 'رابط الدعوة',
        'airdrop.milestones': 'مراتب الجيش', 'mission.revealLater': 'ستكشف بعد المهمة السابقة',
        'mission.waitDays': 'ستكشف بعد {days} يوم', 'mission.completed': 'مكتمل',
        'withdrawal.unlocked': 'تم فتح السحب!', 'premium.unlocked': 'تم تفعيل البريميوم!',
        'settings.language': 'اللغة', 'settings.theme': 'المظهر', 'settings.logout': 'تسجيل الخروج',
        'admin.panel': 'لوحة المشرف', 'referral.bonus': 'اربح 500 TROLL عن كل إحالة!'
    }
};

function t(key, params = {}) {
    let text = LOCALES[appState.language]?.[key] || LOCALES.en[key] || key;
    Object.keys(params).forEach(k => text = text.replace(`{${k}}`, params[k]));
    return text;
}

// ====== 8. HELPER FUNCTIONS ======
function formatBalance(balance, symbol) {
    if (balance === undefined || balance === null) balance = 0;
    if (symbol === 'TROLL') return balance.toLocaleString() + ' TROLL';
    return balance.toLocaleString() + ' ' + symbol;
}

function formatNumber(num) {
    if (num === undefined || num === null) return '0.00';
    if (num >= 1e6) return (num/1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num/1e3).toFixed(2) + 'K';
    return num.toFixed(2);
}

function getCurrencyIcon(symbol) { return ICONS[symbol] || ICONS.TROLL; }

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    if (!toast || !toastMessage) return;
    
    toastMessage.textContent = msg;
    toast.classList.remove('hidden');
    
    const icon = toast.querySelector('i');
    if (type === 'success') icon.className = 'fa-solid fa-circle-check';
    else if (type === 'error') icon.className = 'fa-solid fa-circle-exclamation';
    else icon.className = 'fa-solid fa-circle-info';
    
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function closeModal(id) { 
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('show'); 
}

function copyToClipboard(text) { 
    navigator.clipboard?.writeText(text); 
    showToast(t('nav.copied') || 'Copied!', 'success'); 
}

// ====== 9. API LAYER ======
async function apiCall(endpoint, method = 'GET', body = null) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    
    try {
        const res = await fetch(`/api${endpoint}`, opts);
        const data = await res.json();
        return data;
    } catch(e) {
        console.error("API Error:", e);
        return { success: false, error: e.message };
    }
}

// ====== 10. CONFIG LOADING ======
async function loadConfig() {
    try {
        const res = await fetch('/api/config');
        appConfig = await res.json();
        
        if (appConfig.adminId) CONFIG.APP.adminId = appConfig.adminId;
        if (appConfig.ownerWallet) CONFIG.APP.ownerWallet = appConfig.ownerWallet;
        
        if (appConfig.firebaseConfig && typeof firebase !== 'undefined') {
            if (!firebase.apps.length) firebase.initializeApp(appConfig.firebaseConfig);
            db = firebase.firestore();
            console.log('🔥 Firebase ready');
        }
        return true;
    } catch (error) {
        console.error('❌ Config error:', error);
        return false;
    }
}

// ====== 11. PRICES WITH COINGECKO ======
async function fetchLivePrices(force = false) {
    const now = Date.now();
    if (!force && lastPricesFetch && (now - lastPricesFetch) < CONFIG.CACHE.pricesTTL) return;
    
    try {
        const allCoins = [...TOP_CRYPTOS, ...MEME_COINS];
        const ids = allCoins.map(c => c.coingeckoId).join(',');
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
        const data = await res.json();
        
        allCoins.forEach(crypto => {
            if (data[crypto.coingeckoId]) {
                appState.prices[crypto.symbol] = {
                    price: data[crypto.coingeckoId].usd,
                    change: data[crypto.coingeckoId].usd_24h_change || 0
                };
            }
        });
        
        if (!appState.prices['TROLL']) {
            appState.prices['TROLL'] = { price: CONFIG.ECONOMY.trollPriceFallback, change: 0 };
        }
        
        lastPricesFetch = now;
        
        if (appState.currentPage === 'wallet') {
            renderAssets();
            renderTopCryptos();
            renderMemeCoins();
            updateTotalBalance();
        }
    } catch(e) { 
        console.error("Price fetch error:", e); 
        appState.prices['TROLL'] = { price: CONFIG.ECONOMY.trollPriceFallback, change: 0 };
    }
}

function refreshPrices() { 
    fetchLivePrices(true); 
    showToast(t('prices.refreshed') || 'Prices refreshed!', 'success'); 
}

// ====== 12. USER DATA MANAGEMENT ======
function getDefaultMissions() {
    return {
        mission1: { completed: false, revealed: true, walletAddress: null },
        mission2: { completed: false, revealed: false, currentAmount: 0, requiredAmount: 12500 },
        mission3: { completed: false, revealed: false, referralsAtStart: 0, currentNewReferrals: 0, requiredReferrals: 12 },
        mission4: { completed: false, revealed: false, revealDate: null, requiredBNB: 0.025, requiredSOL: 0.25 }
    };
}

async function loadUserData() {
    try {
        const userId = window.TrollArmy.userId;
        const isGuest = window.TrollArmy.isGuest;
        
        console.log("📂 Loading user:", userId, "| Guest:", isGuest);
        
        // Check admin
        if (!isGuest && userId) {
            appState.isAdmin = (userId === CONFIG.APP.adminId);
        }
        
        if (!isGuest && userId) {
            const res = await apiCall(`/users/${userId}`);
            
            if (res.success && res.data) {
                userData = res.data;
                
                if (!userData.withdrawalMissions) {
                    userData.withdrawalMissions = getDefaultMissions();
                    await saveUserData();
                }
                
                localStorage.setItem(`troll_${userId}`, JSON.stringify(userData));
                renderUI();
                checkAdminAndAddCrown();
                
                if (window.TrollArmy.pendingReferral) {
                    await processReferral(window.TrollArmy.pendingReferral);
                }
                
                await updateMissionsProgress();
                return;
            }
        }
        
        // Show onboarding for guests or new users
        document.getElementById('onboardingScreen').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('bottomNav').style.display = 'none';
        
        if (isGuest) {
            document.querySelector('.onboarding-container h1').textContent = 'Open in Telegram';
            document.querySelector('.onboarding-container p').textContent = 'Please open this app from Telegram to create your wallet';
        }
        
    } catch(e) { console.error("Load user error:", e); }
}

async function saveUserData() {
    if (userData && !window.TrollArmy.isGuest) {
        localStorage.setItem(`troll_${window.TrollArmy.userId}`, JSON.stringify(userData));
        await apiCall(`/users/${window.TrollArmy.userId}`, 'PATCH', { updates: userData });
    }
}

async function createNewWallet() {
    const userId = window.TrollArmy?.userId;
    
    if (!userId || userId.startsWith('guest_')) {
        showToast('Please open from Telegram', 'error');
        return;
    }
    
    console.log("✅ Creating wallet for:", userId);
    
    const btn = document.getElementById('createWalletBtn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...'; }
    
    try {
        const newUser = {
            userId: userId,
            userName: window.TrollArmy.userName,
            userUsername: window.TrollArmy.userUsername,
            balances: { TROLL: CONFIG.ECONOMY.welcomeBonus, BNB: 0, SOL: 0, ETH: 0, TRON: 0 },
            referralCode: userId,
            referredBy: window.TrollArmy.pendingReferral || null,
            referrals: [],
            inviteCount: 0,
            referralEarnings: 0,
            totalEarned: CONFIG.ECONOMY.welcomeBonus,
            premium: false,
            avatar: '🧌',
            createdAt: new Date().toISOString(),
            withdrawalUnlocked: false,
            claimedMilestones: [],
            tonWallet: null,
            settings: { solanaWallet: null },
            withdrawalMissions: getDefaultMissions(),
            notifications: [{
                id: Date.now().toString(),
                message: `🎉 Welcome! +${CONFIG.ECONOMY.welcomeBonus} TROLL`,
                read: false,
                timestamp: new Date().toISOString()
            }],
            transactions: []
        };
        
        const res = await apiCall('/users', 'POST', { userId, userData: newUser });
        
        if (res.success) {
            userData = newUser;
            localStorage.setItem(`troll_${userId}`, JSON.stringify(userData));
            
            document.getElementById('onboardingScreen').style.display = 'none';
            document.getElementById('mainApp').style.display = 'block';
            document.getElementById('bottomNav').style.display = 'flex';
            
            renderUI();
            showToast(`✅ Wallet created! +${CONFIG.ECONOMY.welcomeBonus} TROLL`, 'success');
            checkAdminAndAddCrown();
            
            if (window.TrollArmy.pendingReferral) {
                await processReferral(window.TrollArmy.pendingReferral);
            }
        }
    } catch(e) { 
        showToast('Failed to create wallet', 'error'); 
    } finally { 
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-plus-circle"></i> Create a new wallet'; } 
    }
}

// ====== 13. REFERRAL SYSTEM ======
async function processReferral(code) {
    if (!code || code === window.TrollArmy.userId || userData?.referredBy) return;
    
    console.log("🔗 Processing referral:", code);
    
    const res = await apiCall('/referral', 'POST', { referrerId: code, newUserId: window.TrollArmy.userId });
    
    if (res.success && userData) {
        userData.referredBy = code;
        userData.balances.TROLL = (userData.balances.TROLL || 0) + CONFIG.ECONOMY.referralBonus;
        userData.referralEarnings = (userData.referralEarnings || 0) + CONFIG.ECONOMY.referralBonus;
        userData.totalEarned = (userData.totalEarned || 0) + CONFIG.ECONOMY.referralBonus;
        await saveUserData();
        await updateMissionsProgress();
        renderUI();
        showToast(`🎉 +${CONFIG.ECONOMY.referralBonus} TROLL from referral!`, 'success');
    }
}

function getReferralLink() {
    return `${CONFIG.APP.botLink}?startapp=${window.TrollArmy.userId}`;
}

function copyInviteLink() { 
    copyToClipboard(getReferralLink()); 
    showToast('🔗 Link copied!', 'success');
}

function shareInviteLink() {
    const link = getReferralLink();
    const text = `🧌 Join Troll Army! Get ${CONFIG.ECONOMY.welcomeBonus} TROLL + ${CONFIG.ECONOMY.referralBonus} per referral!\n\n👉 ${link}`;
    
    if (window.TrollArmy?.hasTelegramWebApp) {
        window.Telegram?.WebApp?.openTelegramLink(`https://t.me/share/url?url=&text=${encodeURIComponent(text)}`);
    } else {
        copyToClipboard(text);
        showToast('Link copied! Share it with friends', 'success');
    }
}

async function claimMilestone(refs) {
    const milestone = REFERRAL_MILESTONES.find(m => m.referrals === refs);
    if (!milestone || milestone.isSpecial) return;
    
    const claimed = userData.claimedMilestones?.includes(refs);
    if (claimed) return;
    if ((userData.inviteCount || 0) < refs) { 
        showToast(`Need ${refs} referrals`, 'error'); 
        return; 
    }
    
    const res = await apiCall('/claim-milestone', 'POST', { 
        userId: window.TrollArmy.userId, 
        milestoneReferrals: refs, 
        reward: milestone.reward 
    });
    
    if (res.success) {
        userData.balances.TROLL = (userData.balances.TROLL || 0) + milestone.reward;
        userData.totalEarned = (userData.totalEarned || 0) + milestone.reward;
        if (!userData.claimedMilestones) userData.claimedMilestones = [];
        userData.claimedMilestones.push(refs);
        await saveUserData();
        renderMilestones();
        updateTotalBalance();
        showToast(`✅ Claimed ${milestone.reward.toLocaleString()} TROLL!`, 'success');
    }
}

// ====== 14. MYSTERY MISSIONS SYSTEM ======
async function updateMissionsProgress() {
    if (!userData) return;
    
    const missions = userData.withdrawalMissions;
    let changed = false;
    
    // Mission 1: Solana Wallet
    if (!missions.mission1.completed && userData.settings?.solanaWallet) {
        missions.mission1.completed = true;
        missions.mission1.walletAddress = userData.settings.solanaWallet;
        
        if (!missions.mission2.revealed) {
            missions.mission2.revealed = true;
            addNotification('🔓 Mission 2 revealed!');
        }
        changed = true;
    }
    
    // Mission 2: Referral Earnings
    if (missions.mission2.revealed && !missions.mission2.completed) {
        missions.mission2.currentAmount = userData.referralEarnings || 0;
        if (missions.mission2.currentAmount >= missions.mission2.requiredAmount) {
            missions.mission2.completed = true;
            
            if (!missions.mission3.revealed) {
                missions.mission3.revealed = true;
                missions.mission3.referralsAtStart = userData.inviteCount || 0;
                addNotification('🔓 Mission 3 revealed!');
            }
            changed = true;
        }
    }
    
    // Mission 3: New Referrals
    if (missions.mission3.revealed && !missions.mission3.completed) {
        missions.mission3.currentNewReferrals = Math.max(0, (userData.inviteCount || 0) - (missions.mission3.referralsAtStart || 0));
        if (missions.mission3.currentNewReferrals >= missions.mission3.requiredReferrals) {
            missions.mission3.completed = true;
            
            const revealDate = new Date();
            revealDate.setDate(revealDate.getDate() + 20);
            missions.mission4.revealDate = revealDate.toISOString();
            addNotification('⏳ Final mission reveals in 20 days!');
            changed = true;
        }
    }
    
    // Mission 4: Reveal Check
    if (missions.mission3.completed && !missions.mission4.revealed) {
        if (new Date() >= new Date(missions.mission4.revealDate)) {
            missions.mission4.revealed = true;
            addNotification('🔓 Final mission revealed!');
            changed = true;
        }
    }
    
    // Mission 4: Balance Check
    if (missions.mission4.revealed && !missions.mission4.completed) {
        const bnb = userData.balances?.BNB || 0;
        const sol = userData.balances?.SOL || 0;
        if (bnb >= missions.mission4.requiredBNB || sol >= missions.mission4.requiredSOL) {
            missions.mission4.completed = true;
            changed = true;
        }
    }
    
    // Check Unlock
    const allCompleted = missions.mission1.completed && missions.mission2.completed && 
                        missions.mission3.completed && missions.mission4.completed;
    
    if (allCompleted && !userData.withdrawalUnlocked) {
        userData.withdrawalUnlocked = true;
        addNotification('🎉🎉 WITHDRAWAL UNLOCKED!');
        celebrateUnlock();
        changed = true;
    }
    
    if (changed) await saveUserData();
    if (appState.currentPage === 'airdrop') renderMissionsUI();
}

function addNotification(message) {
    if (!userData.notifications) userData.notifications = [];
    userData.notifications.unshift({
        id: Date.now().toString(),
        message,
        read: false,
        timestamp: new Date().toISOString()
    });
}

function celebrateUnlock() {
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.background = ['#FFD700', '#2ecc71', '#e74c3c', '#3498db'][Math.floor(Math.random() * 4)];
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 4000);
        }, i * 50);
    }
    showToast('🎉 Withdrawal Unlocked!', 'success');
}

// ====== 15. SOLANA WALLET ======
function showSolanaWalletModal() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
            <div class="modal-icon">🔑</div>
            <h2>${appState.language === 'ar' ? 'إضافة محفظة Solana' : 'Add Solana Wallet'}</h2>
            <p style="margin-bottom:16px;color:var(--text-secondary);">${appState.language === 'ar' ? 'أدخل عنوان TROLL على شبكة Solana' : 'Enter your TROLL address on Solana'}</p>
            <div class="input-group">
                <input type="text" id="solanaAddressInput" placeholder="GzR...kLp" style="width:100%;padding:12px;border-radius:8px;">
            </div>
            <button class="modal-action-btn" onclick="saveSolanaWallet()">${appState.language === 'ar' ? 'حفظ العنوان' : 'Save Address'}</button>
        </div>
    `;
    document.body.appendChild(modal);
}

async function saveSolanaWallet() {
    const input = document.getElementById('solanaAddressInput');
    const address = input?.value.trim();
    
    if (!address || address.length < 32) {
        showToast(appState.language === 'ar' ? 'عنوان غير صالح' : 'Invalid address', 'error');
        return;
    }
    
    userData.settings = userData.settings || {};
    userData.settings.solanaWallet = address;
    await saveUserData();
    await updateMissionsProgress();
    
    document.querySelector('.modal')?.remove();
    showToast('✅ ' + (appState.language === 'ar' ? 'تم حفظ العنوان!' : 'Wallet saved!'), 'success');
    renderUI();
    if (appState.currentPage === 'airdrop') renderMissionsUI();
}

// ====== 16. RENDER UI ======
function renderUI() {
    if (appState.currentPage === 'wallet') {
        renderAssets();
        renderTopCryptos();
        renderMemeCoins();
        updateTotalBalance();
    } else if (appState.currentPage === 'airdrop') {
        renderAirdrop();
        renderMissionsUI();
        renderMilestones();
    } else if (appState.currentPage === 'settings') {
        renderSettings();
    }
    
    // Header
    const userNameEl = document.getElementById('userName');
    const userIdEl = document.getElementById('userIdDisplay');
    const avatarEl = document.getElementById('userAvatar');
    
    if (userNameEl) userNameEl.textContent = userData?.userName || window.TrollArmy.userName || 'Troll';
    if (userIdEl) userIdEl.textContent = `ID: ${(userData?.userId || window.TrollArmy.userId || '').slice(-8)}`;
    if (avatarEl) {
        if (userData?.premium) {
            avatarEl.innerHTML = getTrollFaceSVG();
            avatarEl.classList.add('avatar-premium');
        } else {
            avatarEl.textContent = userData?.avatar || '🧌';
        }
    }
}

function getTrollFaceSVG() {
    return `<svg viewBox="0 0 100 100" width="40" height="40">
        <defs><radialGradient id="faceGrad" cx="50%" cy="50%" r="50%"><stop offset="0%" style="stop-color:#FFD700"/><stop offset="100%" style="stop-color:#DAA520"/></radialGradient></defs>
        <circle cx="50" cy="50" r="48" fill="url(#faceGrad)" stroke="#B8860B" stroke-width="2"/>
        <path d="M 28 68 Q 50 88, 78 58 Q 82 52, 75 48 Q 58 70, 28 62 Z" fill="#2C1810"/>
        <ellipse cx="35" cy="40" rx="8" ry="10" fill="#FFF" stroke="#333" stroke-width="1"/><circle cx="38" cy="40" r="3" fill="#000"/>
        <ellipse cx="65" cy="40" rx="8" ry="10" fill="#FFF" stroke="#333" stroke-width="1"/><circle cx="62" cy="42" r="3" fill="#000"/>
    </svg>`;
}

function renderAssets() {
    const container = document.getElementById('assetsList');
    if (!container || !userData) return;
    
    container.innerHTML = ALL_ASSETS.map(asset => {
        const bal = userData.balances?.[asset.symbol] || 0;
        const price = appState.prices[asset.symbol]?.price || 0;
        const value = bal * price;
        
        return `
            <div class="asset-item" onclick="showAssetDetails('${asset.symbol}')">
                <div class="asset-left">
                    <img src="${getCurrencyIcon(asset.symbol)}" class="asset-icon-img" alt="${asset.symbol}">
                    <div class="asset-info">
                        <h4>${asset.name}</h4>
                        <p>${asset.symbol}</p>
                    </div>
                </div>
                <div class="asset-right">
                    <div class="asset-balance">${formatBalance(bal, asset.symbol)}</div>
                    ${value > 0 ? `<div class="asset-value">$${formatNumber(value)}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function renderTopCryptos() {
    const container = document.getElementById('topCryptoList');
    if (!container) return;
    
    container.innerHTML = TOP_CRYPTOS.map(crypto => {
        const data = appState.prices[crypto.symbol] || { price: 0, change: 0 };
        const changeClass = data.change >= 0 ? 'positive' : 'negative';
        const changeSymbol = data.change >= 0 ? '+' : '';
        const decimals = crypto.symbol === 'TROLL' ? 5 : 2;
        
        return `
            <div class="crypto-item" onclick="showCryptoDetails('${crypto.symbol}')">
                <div class="crypto-left">
                    <img src="${getCurrencyIcon(crypto.symbol)}" class="crypto-icon-img" alt="${crypto.symbol}">
                    <div class="crypto-info">
                        <h4>${crypto.name}</h4>
                        <p>${crypto.symbol}</p>
                    </div>
                </div>
                <div class="crypto-right">
                    <div class="crypto-price">$${data.price.toFixed(decimals)}</div>
                    <div class="crypto-change ${changeClass}">${changeSymbol}${data.change.toFixed(1)}%</div>
                </div>
            </div>
        `;
    }).join('');
}

function renderMemeCoins() {
    const container = document.getElementById('memeCoinList');
    if (!container) return;
    
    container.innerHTML = MEME_COINS.map(crypto => {
        const data = appState.prices[crypto.symbol] || { price: 0, change: 0 };
        const changeClass = data.change >= 0 ? 'positive' : 'negative';
        const changeSymbol = data.change >= 0 ? '+' : '';
        
        return `
            <div class="crypto-item" onclick="showCryptoDetails('${crypto.symbol}')">
                <div class="crypto-left">
                    <img src="${getCurrencyIcon(crypto.symbol)}" class="crypto-icon-img" alt="${crypto.symbol}">
                    <div class="crypto-info">
                        <h4>${crypto.name}</h4>
                        <p>${crypto.symbol}</p>
                    </div>
                </div>
                <div class="crypto-right">
                    <div class="crypto-price">$${data.price.toFixed(8)}</div>
                    <div class="crypto-change ${changeClass}">${changeSymbol}${data.change.toFixed(1)}%</div>
                </div>
            </div>
        `;
    }).join('');
}

function updateTotalBalance() {
    if (!userData) return;
    
    let total = 0;
    for (const asset of ALL_ASSETS) {
        const bal = userData.balances?.[asset.symbol] || 0;
        const price = appState.prices[asset.symbol]?.price || 0;
        total += bal * price;
    }
    
    const el = document.getElementById('totalBalance');
    if (el) el.textContent = '$' + total.toFixed(2);
    
    const trollEl = document.getElementById('trollBalance');
    const usdEl = document.getElementById('trollUsdValue');
    if (trollEl && usdEl) {
        const trollBal = userData.balances?.TROLL || 0;
        const trollPrice = appState.prices['TROLL']?.price || CONFIG.ECONOMY.trollPriceFallback;
        trollEl.textContent = trollBal.toLocaleString();
        usdEl.textContent = (trollBal * trollPrice).toFixed(2);
    }
}

function renderAirdrop() {
    if (!userData) return;
    
    const link = getReferralLink();
    const inviteLinkInput = document.getElementById('inviteLink');
    if (inviteLinkInput) inviteLinkInput.value = link;
    
    const totalInvitesEl = document.getElementById('totalInvites');
    const trollEarnedEl = document.getElementById('trollEarned');
    
    if (totalInvitesEl) totalInvitesEl.textContent = userData.inviteCount || 0;
    if (trollEarnedEl) trollEarnedEl.textContent = (userData.referralEarnings || 0).toLocaleString();
}

function renderMissionsUI() {
    const container = document.getElementById('withdrawalLockCard');
    if (!container || !userData) return;
    
    const missions = userData.withdrawalMissions;
    
    if (userData.premium) {
        container.innerHTML = `
            <div class="premium-unlocked-card">
                <div class="premium-icon-large">😏</div>
                <h3>${t('premium.unlocked')}</h3>
                <p>${appState.language === 'ar' ? 'سحب فوري بدون مهام!' : 'Instant withdrawal access!'}</p>
            </div>
        `;
        return;
    }
    
    const missionTitles = MYSTERY_MISSIONS;
    const lang = appState.language;
    
    let html = `
        <div class="lock-header">
            <i class="fa-solid fa-${userData.withdrawalUnlocked ? 'unlock' : 'lock'}"></i>
            <span>${userData.withdrawalUnlocked ? '✅ ' + t('withdrawal.unlocked') : '🔒 ' + (lang === 'ar' ? 'السحب مقفل' : 'Withdrawal Locked')}</span>
        </div>
        <div class="missions-list-vertical">
    `;
    
    // Mission 1
    html += `
        <div class="mission-card ${missions.mission1.completed ? 'completed' : ''}">
            <div class="mission-icon">${missions.mission1.completed ? '✅' : '1️⃣'}</div>
            <div class="mission-content">
                <h4>${missionTitles.mission1.title[lang]}</h4>
                <p>${userData.settings?.solanaWallet ? (lang === 'ar' ? 'المحفظة: ' : 'Wallet: ') + userData.settings.solanaWallet.slice(0, 8) + '...' : missionTitles.mission1.description[lang]}</p>
                ${!missions.mission1.completed ? `<button class="mission-action-btn" onclick="showSolanaWalletModal()">${lang === 'ar' ? 'إضافة محفظة' : 'Add Wallet'}</button>` : ''}
            </div>
        </div>
    `;
    
    // Mission 2
    if (missions.mission2.revealed) {
        const prog = (missions.mission2.currentAmount / 12500) * 100;
        html += `
            <div class="mission-card ${missions.mission2.completed ? 'completed' : ''}">
                <div class="mission-icon">${missions.mission2.completed ? '✅' : '2️⃣'}</div>
                <div class="mission-content">
                    <h4>${missionTitles.mission2.title[lang]}</h4>
                    <p>${missions.mission2.currentAmount.toLocaleString()} / 12,500 TROLL</p>
                    <div class="progress-bar small"><div class="progress-fill" style="width:${prog}%"></div></div>
                    <p class="mission-hint">💡 ${missionTitles.mission2.hint[lang]}</p>
                </div>
            </div>
        `;
    } else {
        html += `<div class="mission-card mystery"><div class="mission-icon">❓</div><div class="mission-content"><h4>Mission 2: ???</h4><p>${t('mission.revealLater')}</p></div></div>`;
    }
    
    // Mission 3
    if (missions.mission3.revealed) {
        const prog = (missions.mission3.currentNewReferrals / 12) * 100;
        html += `
            <div class="mission-card ${missions.mission3.completed ? 'completed' : ''}">
                <div class="mission-icon">${missions.mission3.completed ? '✅' : '3️⃣'}</div>
                <div class="mission-content">
                    <h4>${missionTitles.mission3.title[lang]}</h4>
                    <p>${missions.mission3.currentNewReferrals} / 12 ${lang === 'ar' ? 'إحالة جديدة' : 'new referrals'}</p>
                    <div class="progress-bar small"><div class="progress-fill" style="width:${prog}%"></div></div>
                    <p class="mission-hint">💡 ${missionTitles.mission3.hint[lang]}</p>
                </div>
            </div>
        `;
    } else {
        html += `<div class="mission-card mystery"><div class="mission-icon">❓</div><div class="mission-content"><h4>Mission 3: ???</h4><p>${t('mission.revealLater')}</p></div></div>`;
    }
    
    // Mission 4
    if (missions.mission4.revealed) {
        const bnb = userData.balances?.BNB || 0;
        const sol = userData.balances?.SOL || 0;
        html += `
            <div class="mission-card ${missions.mission4.completed ? 'completed' : ''}">
                <div class="mission-icon">${missions.mission4.completed ? '✅' : '4️⃣'}</div>
                <div class="mission-content">
                    <h4>${missionTitles.mission4.title[lang]}</h4>
                    <p>BNB: ${bnb.toFixed(4)} / 0.025 | SOL: ${sol.toFixed(4)} / 0.25</p>
                    <p class="mission-hint">💡 ${missionTitles.mission4.hint[lang]}</p>
                </div>
            </div>
        `;
    } else if (missions.mission3.completed) {
        const revealDate = new Date(missions.mission4.revealDate);
        const daysLeft = Math.max(0, Math.ceil((revealDate - new Date()) / (1000 * 60 * 60 * 24)));
        html += `
            <div class="mission-card mystery-timer">
                <div class="mission-icon">⏳</div>
                <div class="mission-content">
                    <h4>${lang === 'ar' ? 'المهمة الغامضة النهائية' : 'Final Mystery Mission'}</h4>
                    <p>${t('mission.waitDays', {days: daysLeft})}</p>
                    <div class="timer-progress-bar"><div class="timer-fill" style="width:${((20 - daysLeft) / 20) * 100}%"></div></div>
                </div>
            </div>
        `;
    } else {
        html += `<div class="mission-card mystery"><div class="mission-icon">❓</div><div class="mission-content"><h4>Mission 4: ???</h4><p>${t('mission.revealLater')}</p></div></div>`;
    }
    
    html += `</div>`;
    container.innerHTML = html;
}

function renderMilestones() {
    const container = document.getElementById('milestonesList');
    if (!container || !userData) return;
    
    const lang = appState.language;
    
    container.innerHTML = REFERRAL_MILESTONES.map(m => {
        const prog = Math.min(((userData.inviteCount || 0) / m.referrals) * 100, 100);
        const claimed = userData.claimedMilestones?.includes(m.referrals);
        const canClaim = (userData.inviteCount || 0) >= m.referrals && !claimed && !m.isSpecial;
        
        return `
            <div class="milestone-item ${claimed ? 'claimed' : ''}">
                <div class="milestone-header">
                    <span>${m.title[lang]}</span>
                    <span>${m.isSpecial ? '🎁 Mystery Box' : m.reward.toLocaleString() + ' TROLL'}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width:${prog}%"></div>
                </div>
                <div class="progress-text">${userData.inviteCount || 0}/${m.referrals}</div>
                ${canClaim ? `<button class="claim-btn" onclick="claimMilestone(${m.referrals})">${lang === 'ar' ? 'مطالبة' : 'Claim'}</button>` : ''}
                ${claimed ? '<p style="color:#2ecc71;text-align:center;">✓ ' + (lang === 'ar' ? 'تمت المطالبة' : 'Claimed') + '</p>' : ''}
            </div>
        `;
    }).join('');
}

function renderSettings() {
    const settingsAvatar = document.getElementById('settingsAvatar');
    const settingsUserName = document.getElementById('settingsUserName');
    const settingsUserId = document.getElementById('settingsUserId');
    const currentSolanaWallet = document.getElementById('currentSolanaWallet');
    const tonWalletStatus = document.getElementById('tonWalletStatus');
    
    if (settingsAvatar) {
        if (userData?.premium) {
            settingsAvatar.innerHTML = getTrollFaceSVG();
        } else {
            settingsAvatar.textContent = userData?.avatar || '🧌';
        }
    }
    if (settingsUserName) settingsUserName.textContent = userData?.userName || window.TrollArmy.userName;
    if (settingsUserId) settingsUserId.textContent = `ID: ${window.TrollArmy.userId}`;
    if (currentSolanaWallet) {
        const wallet = userData?.settings?.solanaWallet;
        currentSolanaWallet.textContent = wallet ? wallet.slice(0, 8) + '...' + wallet.slice(-4) : (appState.language === 'ar' ? 'غير مضاف' : 'Not set');
    }
    if (tonWalletStatus) {
        tonWalletStatus.textContent = tonConnected && tonWalletAddress ? 
            `${tonWalletAddress.slice(0, 6)}...${tonWalletAddress.slice(-6)}` : 
            (appState.language === 'ar' ? 'غير مرتبطة' : 'Not connected');
        tonWalletStatus.style.color = tonConnected ? '#2ecc71' : 'var(--text-secondary)';
    }
}

// ====== 17. TON CONNECT & PREMIUM ======
async function initTONConnect() {
    if (typeof TON_CONNECT_UI === 'undefined') return;
    try {
        tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
            manifestUrl: `${window.location.origin}/tonconnect-manifest.json`,
            buttonRootId: 'tonConnectButton'
        });
        const connected = await tonConnectUI.connectionRestored;
        if (connected && tonConnectUI.wallet) {
            tonConnected = true;
            tonWalletAddress = tonConnectUI.wallet.account.address;
            renderSettings();
        }
    } catch (error) { console.error('❌ TON init error:', error); }
}

async function connectTONWallet() {
    if (!tonConnectUI) { showToast('TON Connect not ready', 'error'); return; }
    try {
        await tonConnectUI.openModal();
        const checkConnection = setInterval(async () => {
            if (tonConnectUI.wallet) {
                clearInterval(checkConnection);
                tonConnected = true;
                tonWalletAddress = tonConnectUI.wallet.account.address;
                userData.tonWallet = tonWalletAddress;
                await saveUserData();
                renderSettings();
                showToast('✅ TON Wallet connected!', 'success');
            }
        }, 500);
        setTimeout(() => clearInterval(checkConnection), 30000);
    } catch (error) { showToast('Failed to connect', 'error'); }
}

function showPremiumModal() { 
    document.getElementById('premiumModal')?.classList.add('show'); 
}

async function buyPremium() {
    if (!tonConnected || !tonConnectUI) { showToast('Connect TON wallet first', 'error'); return; }
    showToast('🔄 Processing...', 'info');
    try {
        const transaction = { 
            validUntil: Math.floor(Date.now() / 1000) + 300, 
            messages: [{ address: CONFIG.APP.ownerWallet, amount: '5000000000' }] 
        };
        const result = await tonConnectUI.sendTransaction(transaction);
        if (result.boc) {
            await apiCall('/buy-premium', 'POST', { userId: window.TrollArmy.userId, txHash: result.boc });
            userData.premium = true;
            userData.avatar = '😏';
            userData.withdrawalUnlocked = true;
            await saveUserData();
            renderUI();
            closeModal('premiumModal');
            showToast('🎉 Premium Unlocked! 😏', 'success');
            celebratePremium();
        }
    } catch (error) { showToast('Payment failed: ' + error.message, 'error'); }
}

function celebratePremium() {
    for (let i = 0; i < 30; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.background = ['#FFD700', '#2ecc71', '#e74c3c', '#3498db'][Math.floor(Math.random() * 4)];
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 3000);
    }
}

// ====== 18. DEPOSIT & WITHDRAW ======
function showDepositModal() { 
    document.getElementById('depositModal')?.classList.add('show'); 
    updateDepositInfo();
}

function showWithdrawModal() { 
    if (!userData?.withdrawalUnlocked && !userData?.premium) {
        showToast(appState.language === 'ar' ? 'أكمل المهام أولاً!' : 'Complete missions first!', 'error');
        return;
    }
    document.getElementById('withdrawModal')?.classList.add('show'); 
}

function showHistory() { 
    document.getElementById('historyModal')?.classList.add('show'); 
    renderHistory();
}

function updateDepositInfo() {
    const addressEl = document.getElementById('depositAddress');
    if (addressEl) {
        addressEl.textContent = '0xbf70420f57342c6Bd4267430D4D3b7E946f09450';
    }
}

function copyDepositAddress() {
    const addr = document.getElementById('depositAddress')?.textContent;
    if (addr) copyToClipboard(addr);
}

async function submitDeposit() {
    const txId = document.getElementById('txIdInput')?.value;
    if (!txId) {
        showToast('Enter transaction ID', 'error');
        return;
    }
    
    const res = await apiCall('/deposit', 'POST', { 
        userId: window.TrollArmy.userId, 
        txHash: txId 
    });
    
    if (res.success) {
        showToast('Deposit submitted for verification', 'success');
        closeModal('depositModal');
    }
}

async function submitWithdraw() {
    const amount = document.getElementById('withdrawAmount')?.value;
    const address = document.getElementById('withdrawAddress')?.value;
    
    if (!amount || amount < 10000) {
        showToast('Minimum 10,000 TROLL', 'error');
        return;
    }
    if (!address) {
        showToast('Enter wallet address', 'error');
        return;
    }
    
    const res = await apiCall('/withdraw', 'POST', { 
        userId: window.TrollArmy.userId, 
        amount, 
        address 
    });
    
    if (res.success) {
        showToast('Withdrawal requested!', 'success');
        closeModal('withdrawModal');
    }
}

function renderHistory() {
    const container = document.getElementById('historyList');
    if (!container || !userData) return;
    
    const txs = userData.transactions || [];
    
    if (!txs.length) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-inbox"></i><p>${appState.language === 'ar' ? 'لا توجد معاملات' : 'No transactions yet'}</p></div>`;
        return;
    }
    
    container.innerHTML = txs.reverse().slice(0, 20).map(tx => `
        <div class="history-item">
            <div class="history-item-header">
                <div class="history-type ${tx.type}">
                    <i class="fas ${tx.type === 'deposit' ? 'fa-circle-down' : 'fa-circle-up'}"></i>
                    <span>${tx.type}</span>
                </div>
                <span class="history-status ${tx.status}">${tx.status}</span>
            </div>
            <div class="history-details">
                <span class="history-amount">${tx.amount} ${tx.currency}</span>
                <span class="history-date">${new Date(tx.timestamp).toLocaleString()}</span>
            </div>
        </div>
    `).join('');
}

// ====== 19. NAVIGATION ======
function showWallet() {
    appState.currentPage = 'wallet';
    document.querySelectorAll('.section').forEach(t => t.classList.add('hidden'));
    document.getElementById('walletSection')?.classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector('.nav-item[data-tab="wallet"]')?.classList.add('active');
    renderUI();
}

function showAirdrop() {
    appState.currentPage = 'airdrop';
    document.querySelectorAll('.section').forEach(t => t.classList.add('hidden'));
    document.getElementById('airdropSection')?.classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector('.nav-item[data-tab="airdrop"]')?.classList.add('active');
    renderUI();
}

function showSettings() {
    appState.currentPage = 'settings';
    document.querySelectorAll('.section').forEach(t => t.classList.add('hidden'));
    document.getElementById('settingsSection')?.classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector('.nav-item[data-tab="settings"]')?.classList.add('active');
    renderSettings();
}

// ====== 20. THEME & LANGUAGE ======
function toggleLanguage() {
    appState.language = appState.language === 'en' ? 'ar' : 'en';
    localStorage.setItem('language', appState.language);
    
    document.body.classList.toggle('rtl', appState.language === 'ar');
    document.documentElement.dir = appState.language === 'ar' ? 'rtl' : 'ltr';
    
    renderUI();
    showToast(appState.language === 'en' ? 'Language: English' : 'اللغة: العربية', 'success');
}

function toggleTheme() {
    appState.theme = appState.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', appState.theme);
    document.documentElement.setAttribute('data-theme', appState.theme);
    showToast(`Theme: ${appState.theme}`, 'success');
}

function logout() { 
    if (confirm(appState.language === 'ar' ? 'هل أنت متأكد من تسجيل الخروج؟' : 'Are you sure you want to logout?')) { 
        localStorage.clear(); 
        location.reload(); 
    } 
}

// ====== 21. HELPERS ======
function showAssetDetails(sym) {
    const bal = userData?.balances?.[sym] || 0;
    const price = appState.prices[sym]?.price || 0;
    showToast(`${sym}: ${formatBalance(bal, sym)} ($${formatNumber(bal * price)})`, 'info');
}

function showCryptoDetails(sym) {
    const data = appState.prices[sym] || { price: 0, change: 0 };
    const changeSymbol = data.change >= 0 ? '+' : '';
    showToast(`${sym}: $${data.price.toFixed(6)} (${changeSymbol}${data.change.toFixed(1)}%)`, 'info');
}

function showNotifications() {
    document.getElementById('notificationsModal')?.classList.add('show');
    const container = document.getElementById('notificationsList');
    if (!container || !userData) return;
    
    const notes = userData.notifications || [];
    if (!notes.length) {
        container.innerHTML = `<div class="empty-state"><p>${appState.language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}</p></div>`;
        return;
    }
    
    container.innerHTML = notes.map(n => `
        <div class="notification-item ${n.read ? '' : 'unread'}">
            <div>${n.message}</div>
            <div style="font-size:11px;">${new Date(n.timestamp).toLocaleString()}</div>
        </div>
    `).join('');
}

function openSupport() {
    window.open('https://t.me/TrollSupport', '_blank');
}

function showComingSoon(feature) {
    showToast(`${feature} coming soon!`, 'info');
}

// ====== 22. ADMIN ======
function checkAdminAndAddCrown() {
    if (!appState.isAdmin) return;
    
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions || document.getElementById('adminCrownBtn')) return;
    
    const adminBtn = document.createElement('button');
    adminBtn.id = 'adminCrownBtn';
    adminBtn.className = 'icon-btn';
    adminBtn.innerHTML = '<i class="fa-solid fa-crown" style="color: gold;"></i>';
    adminBtn.onclick = showAdminPanel;
    headerActions.insertBefore(adminBtn, headerActions.firstChild);
}

function showAdminPanel() {
    if (!appState.isAdmin) { showToast('Access denied', 'error'); return; }
    document.getElementById('adminPanel')?.classList.remove('hidden');
}

function closeAdminPanel() {
    document.getElementById('adminPanel')?.classList.add('hidden');
}

// ====== 23. INITIALIZATION ======
document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 Troll Army v18.0 FINAL");
    
    // Theme
    document.documentElement.setAttribute('data-theme', appState.theme);
    
    // Language
    if (appState.language === 'ar') {
        document.body.classList.add('rtl');
        document.documentElement.dir = 'rtl';
    }
    
    // Bind buttons
    document.getElementById('createWalletBtn')?.addEventListener('click', createNewWallet);
    document.getElementById('guestPreviewBtn')?.addEventListener('click', () => {
        userData = {
            userId: 'demo',
            userName: 'Demo User',
            balances: { TROLL: 1000 },
            inviteCount: 0,
            referralEarnings: 0,
            premium: false,
            avatar: '🧌',
            withdrawalUnlocked: false,
            settings: {},
            withdrawalMissions: getDefaultMissions(),
            notifications: []
        };
        document.getElementById('onboardingScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        document.getElementById('bottomNav').style.display = 'flex';
        renderUI();
        showToast('Demo Mode', 'info');
    });
    
    // Hide splash
    setTimeout(() => {
        document.getElementById('splashScreen')?.classList.add('hidden');
    }, 2000);
    
    // Load config and prices
    await loadConfig();
    await initTONConnect();
    await fetchLivePrices();
    
    setInterval(fetchLivePrices, 300000);
    
    console.log("✅ Troll Army Ready!");
});

// ====== 24. EXPORTS ======
window.showWallet = showWallet;
window.showAirdrop = showAirdrop;
window.showSettings = showSettings;
window.showDepositModal = showDepositModal;
window.showWithdrawModal = showWithdrawModal;
window.showPremiumModal = showPremiumModal;
window.showHistory = showHistory;
window.showNotifications = showNotifications;
window.showAdminPanel = showAdminPanel;
window.closeModal = closeModal;
window.closeAdminPanel = closeAdminPanel;
window.copyInviteLink = copyInviteLink;
window.shareInviteLink = shareInviteLink;
window.copyDepositAddress = copyDepositAddress;
window.submitDeposit = submitDeposit;
window.submitWithdraw = submitWithdraw;
window.claimMilestone = claimMilestone;
window.buyPremium = buyPremium;
window.refreshPrices = refreshPrices;
window.toggleLanguage = toggleLanguage;
window.toggleTheme = toggleTheme;
window.logout = logout;
window.openSupport = openSupport;
window.connectTONWallet = connectTONWallet;
window.showComingSoon = showComingSoon;
window.showAssetDetails = showAssetDetails;
window.showCryptoDetails = showCryptoDetails;
window.showSolanaWalletModal = showSolanaWalletModal;
window.saveSolanaWallet = saveSolanaWallet;

console.log("✅ Troll Army v18.0 FINAL - All systems ready!");
console.log("✅ Mystery Missions: 4 missions with 20-day timer");
console.log("✅ Referral System: Complete with milestones");
console.log("✅ CoinGecko: Live prices");
console.log("✅ TON Connect: Premium system");
console.log("✅ Admin Panel: Complete");
