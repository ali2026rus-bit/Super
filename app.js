// ============================================================================
// TROLL ARMY - PROFESSIONAL EDITION v28.0
// COMPLETE REWRITE WITH:
// - Fixed Add Wallet Button & Settings Solana Wallet Link
// - Professional Withdrawal Modal (Deposit-style)
// - Fixed Notifications (No more stacking/cards issues)
// - Removed Transaction ID from Deposit Modal
// - Professional i18n (English default, Arabic full support)
// - FIXED: Mission progress updates instantly after referrals
// ALL ORIGINAL FEATURES PRESERVED
// ============================================================================

// ============================================================================
// SECTION 1: TELEGRAM WEBAPP INITIALIZATION
// ============================================================================

const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
    tg.enableClosingConfirmation?.();
    console.log("✅ Telegram WebApp initialized");
}

// ============================================================================
// SECTION 2: GLOBAL STATE
// ============================================================================

let currentUser = null;
let currentUserId = null;
let isGuest = false;
let currentPage = 'wallet';
let db = null;
let tonConnectUI = null;
let tonConnected = false;
let tonWalletAddress = null;
let appConfig = {};
let cryptoPrices = {};
let currentLanguage = localStorage.getItem('language') || 'en';
let currentTheme = localStorage.getItem('theme') || 'dark';
let unreadNotifications = 0;
let currentManageUserId = null;
let selectedBroadcastTarget = 'all';
let adminAuthenticated = false;
let adminAuthToken = null;

// Admin Panel State
let currentAdminTab = 'dashboard';
let adminStats = { totalUsers: 0, pendingWithdrawals: 0, pendingDeposits: 0, premiumUsers: 0 };
let pendingWithdrawals = [];
let pendingDeposits = [];

// ============================================================================
// SECTION 3: CONFIGURATION
// ============================================================================

const CONFIG = {
    BOT_LINK: 'https://t.me/TROLLMiniappbot/instant',
    WELCOME_BONUS: 1000,
    REFERRAL_BONUS: 500,
    TROLL_PRICE_FALLBACK: 0.01915
};

// ============================================================================
// SECTION 4: ICONS
// ============================================================================

const ICONS = {
    TROLL: 'https://s2.coinmarketcap.com/static/img/coins/64x64/36313.png',
    SOL: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png',
    BNB: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png',
    ETH: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
    TRON: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1958.png',
    BTC: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png',
    DOGE: 'https://s2.coinmarketcap.com/static/img/coins/64x64/74.png',
    SHIB: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5994.png',
    PEPE: 'https://s2.coinmarketcap.com/static/img/coins/64x64/24478.png',
    BONK: 'https://s2.coinmarketcap.com/static/img/coins/64x64/23095.png',
    WIF: 'https://s2.coinmarketcap.com/static/img/coins/64x64/28752.png'
};

// ============================================================================
// SECTION 5: ASSETS
// ============================================================================

const ALL_ASSETS = [
    { symbol: 'TROLL', name: 'Troll Token' },
    { symbol: 'SOL', name: 'Solana' },
    { symbol: 'BNB', name: 'BNB' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'TRON', name: 'TRON' }
];

const MEME_COINS = [
    { symbol: 'DOGE', name: 'Dogecoin' },
    { symbol: 'SHIB', name: 'Shiba Inu' },
    { symbol: 'PEPE', name: 'Pepe' },
    { symbol: 'BONK', name: 'Bonk' },
    { symbol: 'WIF', name: 'Dogwifhat' }
];

const DEPOSIT_CURRENCIES = [
    { symbol: 'BNB', name: 'BNB (BSC/BEP-20)' },
    { symbol: 'SOL', name: 'Solana' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'TRX', name: 'TRON' }
];

const DEPOSIT_MINIMUMS = {
    BNB: 0.01,
    SOL: 0.01,
    ETH: 0.01,
    TRX: 10
};

// ============================================================================
// SECTION 6: MYSTERY MISSIONS
// ============================================================================

const MISSIONS = {
    mission1: {
        id: 'solana_wallet',
        title: 'Mission 1: Connect Solana',
        desc: 'Add your TROLL Solana wallet',
        hint: 'Go to Settings → Solana Wallet'
    },
    mission2: {
        id: 'referral_earnings',
        title: 'Mission 2: Build Wealth',
        desc: 'Earn 12,500 TROLL from referrals',
        hint: 'Each referral gives 500 TROLL',
        required: 12500
    },
    mission3: {
        id: 'new_referrals',
        title: 'Mission 3: Expand Army',
        desc: 'Get 12 NEW referrals',
        hint: 'Only new referrals count',
        required: 12
    },
    mission4: {
        id: 'holdings',
        title: 'Mission 4: Prove Holdings',
        desc: 'Hold 0.025 BNB or 0.25 SOL',
        hint: 'Deposit to your wallet',
        requiredBNB: 0.025,
        requiredSOL: 0.25
    }
};

// ============================================================================
// SECTION 7: MILESTONES
// ============================================================================

const MILESTONES = [
    { referrals: 10, reward: 5000, title: '🤡 Baby Troll' },
    { referrals: 25, reward: 12500, title: '😈 Master Troll' },
    { referrals: 100, reward: 25000, title: '👹 Troll Lord' },
    { referrals: 250, reward: 50000, title: '🧌 Troll King' },
    { referrals: 500, reward: 100000, title: '🔥 Troll God' },
    { referrals: 1000, reward: 0, title: '💀 Grand Master', isSpecial: true }
];

// ============================================================================
// SECTION 8: DEFAULT MISSIONS
// ============================================================================

function getDefaultMissions() {
    return {
        mission1: { completed: false, revealed: true, walletAddress: null },
        mission2: { completed: false, revealed: false, currentAmount: 0, requiredAmount: 12500 },
        mission3: { completed: false, revealed: false, referralsAtStart: 0, currentNewReferrals: 0, requiredReferrals: 12 },
        mission4: { completed: false, revealed: false, revealDate: null, requiredBNB: 0.025, requiredSOL: 0.25 }
    };
}

// ============================================================================
// SECTION 9: TRANSLATIONS (i18n) - PROFESSIONAL
// ============================================================================

const translations = {
    en: {
        'nav.wallet': 'Wallet',
        'nav.airdrop': 'Airdrop',
        'nav.settings': 'Settings',
        'wallet.totalBalance': 'Total Balance',
        'wallet.myAssets': 'My Assets',
        'wallet.topCryptos': 'Top Cryptocurrencies',
        'wallet.memeCoins': 'Meme Coins',
        'wallet.deposit': 'Deposit',
        'wallet.withdraw': 'Withdraw',
        'wallet.history': 'History',
        'airdrop.missions': 'Mystery Missions',
        'airdrop.totalInvites': 'Total Invites',
        'airdrop.earned': 'TROLL Earned',
        'airdrop.yourLink': 'Your Invite Link',
        'airdrop.milestones': 'Troll Ranks',
        'airdrop.share': 'Share on Telegram',
        'airdrop.copy': 'Copy',
        'airdrop.bonus': 'Earn 500 TROLL for each friend who joins!',
        'mission.revealLater': 'Reveals after previous mission',
        'mission.waitDays': 'Reveals in {days} days',
        'mission.addWallet': 'Add Wallet',
        'mission.completed': 'Completed',
        'premium.unlocked': 'Premium Unlocked!',
        'premium.title': 'Premium Unlock',
        'premium.desc': 'Get the legendary Troll Face avatar and INSTANT withdrawal access!',
        'premium.feature1': 'Exclusive Troll Face Avatar',
        'premium.feature2': 'Instant Withdrawal Access',
        'premium.feature3': 'Skip All Mystery Missions',
        'premium.feature4': 'Premium Badge & Glow Effect',
        'premium.price': '5 TON',
        'premium.buy': 'Pay with TON',
        'premium.note': 'Payment processed securely via Telegram Wallet',
        'withdrawal.unlocked': 'Withdrawal Unlocked!',
        'withdrawal.locked': 'Withdrawal Locked',
        'withdrawal.locked.title': '🔒 Withdrawal Locked',
        'withdrawal.locked.message': 'Complete the remaining mystery missions to unlock withdrawal.',
        'withdrawal.missions.left': 'missions left to complete',
        'withdrawal.go.to.missions': 'Go to Missions',
        'withdrawal.available.title': '💸 Withdraw TROLL',
        'withdrawal.amount': 'Amount (min 10,000 TROLL)',
        'withdrawal.address': 'Solana Wallet Address',
        'withdrawal.available.balance': 'Available',
        'withdrawal.submit': 'Request Withdrawal',
        'deposit.title': 'Deposit Crypto',
        'deposit.selectCurrency': 'Select Currency',
        'deposit.address': 'Your Deposit Address',
        'deposit.network': 'Network',
        'deposit.minAmount': 'Minimum Deposit',
        'deposit.warning': 'Only send the correct token to this address.',
        'deposit.copy': 'Copy',
        'deposit.copied': 'Address copied!',
        'deposit.scan': 'Scan QR Code',
        'deposit.confirm': 'I have sent the deposit',
        'deposit.submit': 'Submit Deposit Request',
        'deposit.success': 'Deposit request submitted!',
        'history.title': 'Transaction History',
        'history.all': 'All',
        'history.deposits': 'Deposits',
        'history.withdrawals': 'Withdrawals',
        'history.referrals': 'Referrals',
        'history.empty': 'No transactions yet',
        'notifications.title': 'Notifications',
        'notifications.clearRead': 'Clear Read',
        'notifications.clearAll': 'Clear All',
        'notifications.empty': 'No notifications',
        'settings.profile': 'Profile',
        'settings.premium': 'Premium Unlock',
        'settings.solanaWallet': 'Solana Wallet',
        'settings.tonConnect': 'Connect TON Wallet',
        'settings.darkMode': 'Dark Mode',
        'settings.notifications': 'Notifications',
        'settings.language': 'Language',
        'settings.logout': 'Logout',
        'settings.version': 'Troll Army v28.0',
        'settings.tge': 'TGE: May 2026',
        'settings.notSet': 'Not set',
        'settings.connected': 'Connected',
        'settings.notConnected': 'Not connected',
        'solanaWallet.title': 'Connect Solana Wallet',
        'solanaWallet.desc': 'Enter your TROLL Solana wallet address to complete the first mission.',
        'solanaWallet.placeholder': 'GzR...kLp',
        'solanaWallet.invalid': 'Address must be 32-44 characters',
        'solanaWallet.valid': 'Valid address',
        'solanaWallet.save': 'Save & Continue',
        'solanaWallet.cancel': 'Cancel',
        'solanaWallet.success': 'Wallet saved successfully!',
        'admin.title': 'Admin Panel',
        'admin.authenticate': 'Admin Authentication',
        'admin.password': 'Enter Admin Password',
        'admin.verify': 'Verify',
        'admin.cancel': 'Cancel',
        'admin.dashboard': 'Dashboard',
        'admin.pendingDeposits': 'Pending Deposits',
        'admin.pendingWithdrawals': 'Pending Withdrawals',
        'admin.users': 'Manage Users',
        'admin.broadcast': 'Broadcast',
        'admin.totalUsers': 'Total Users',
        'admin.pending': 'Pending',
        'admin.premium': 'Premium',
        'admin.search': 'Search by User ID or Wallet',
        'admin.searchBtn': 'Search',
        'admin.addBalance': 'Add Balance',
        'admin.removeBalance': 'Remove Balance',
        'admin.blockUser': 'Block Withdrawals',
        'admin.blocked': 'User Blocked',
        'admin.approve': 'Approve',
        'admin.reject': 'Reject',
        'admin.reason': 'Rejection Reason',
        'admin.broadcastMessage': 'Broadcast Message',
        'admin.targetAll': 'All Users',
        'admin.targetBot': 'Bot Only',
        'admin.targetApp': 'App Only',
        'admin.send': 'Send Broadcast',
        'admin.success': 'Operation successful!',
        'admin.error': 'Operation failed',
        'toast.copied': 'Copied to clipboard!',
        'toast.success': 'Success!',
        'toast.error': 'Error!',
        'toast.info': 'Information',
        'guest.mode': 'Guest Mode - Connect Telegram for full access',
        'logout.confirm': 'Are you sure you want to logout?'
    },
    ar: {
        'nav.wallet': 'المحفظة',
        'nav.airdrop': 'الإيردروب',
        'nav.settings': 'الإعدادات',
        'wallet.totalBalance': 'الرصيد الإجمالي',
        'wallet.myAssets': 'أصولي',
        'wallet.topCryptos': 'أفضل العملات',
        'wallet.memeCoins': 'عملات الميم',
        'wallet.deposit': 'إيداع',
        'wallet.withdraw': 'سحب',
        'wallet.history': 'السجل',
        'airdrop.missions': 'المهام الغامضة',
        'airdrop.totalInvites': 'إجمالي الدعوات',
        'airdrop.earned': 'TROLL المكتسبة',
        'airdrop.yourLink': 'رابط الدعوة',
        'airdrop.milestones': 'مراتب الجيش',
        'airdrop.share': 'مشاركة عبر تيليجرام',
        'airdrop.copy': 'نسخ',
        'airdrop.bonus': 'اربح 500 TROLL لكل صديق ينضم!',
        'mission.revealLater': 'ستكشف بعد المهمة السابقة',
        'mission.waitDays': 'ستكشف بعد {days} يوم',
        'mission.addWallet': 'إضافة محفظة',
        'mission.completed': 'مكتمل',
        'premium.unlocked': 'تم تفعيل البريميوم!',
        'premium.title': 'تفعيل البريميوم',
        'premium.desc': 'احصل على أفاتار وجه Troll الأسطوري وصلاحية السحب الفوري!',
        'premium.feature1': 'أفاتار وجه Troll حصري',
        'premium.feature2': 'صلاحية سحب فوري',
        'premium.feature3': 'تخطي جميع المهام الغامضة',
        'premium.feature4': 'شارة بريميوم وتأثير إضاءة',
        'premium.price': '5 TON',
        'premium.buy': 'الدفع عبر TON',
        'premium.note': 'تتم معالجة الدفع بشكل آمن عبر محفظة تيليجرام',
        'withdrawal.unlocked': 'تم فتح السحب!',
        'withdrawal.locked': 'السحب مقفل',
        'withdrawal.locked.title': '🔒 السحب مقفل',
        'withdrawal.locked.message': 'أكمل المهام الغامضة المتبقية لفتح السحب.',
        'withdrawal.missions.left': 'مهمة متبقية للإكمال',
        'withdrawal.go.to.missions': 'اذهب إلى المهام',
        'withdrawal.available.title': '💸 سحب TROLL',
        'withdrawal.amount': 'المبلغ (الحد الأدنى 10,000 TROLL)',
        'withdrawal.address': 'عنوان محفظة Solana',
        'withdrawal.available.balance': 'المتاح',
        'withdrawal.submit': 'طلب السحب',
        'deposit.title': 'إيداع العملات',
        'deposit.selectCurrency': 'اختر العملة',
        'deposit.address': 'عنوان الإيداع',
        'deposit.network': 'الشبكة',
        'deposit.minAmount': 'الحد الأدنى',
        'deposit.warning': 'أرسل فقط العملة الصحيحة إلى هذا العنوان.',
        'deposit.copy': 'نسخ',
        'deposit.copied': 'تم نسخ العنوان!',
        'deposit.scan': 'مسح رمز QR',
        'deposit.confirm': 'لقد قمت بالإيداع',
        'deposit.submit': 'تقديم طلب الإيداع',
        'deposit.success': 'تم تقديم طلب الإيداع!',
        'history.title': 'سجل المعاملات',
        'history.all': 'الكل',
        'history.deposits': 'إيداعات',
        'history.withdrawals': 'سحوبات',
        'history.referrals': 'إحالات',
        'history.empty': 'لا توجد معاملات',
        'notifications.title': 'الإشعارات',
        'notifications.clearRead': 'حذف المقروء',
        'notifications.clearAll': 'حذف الكل',
        'notifications.empty': 'لا توجد إشعارات',
        'settings.profile': 'الملف الشخصي',
        'settings.premium': 'تفعيل البريميوم',
        'settings.solanaWallet': 'محفظة Solana',
        'settings.tonConnect': 'ربط محفظة TON',
        'settings.darkMode': 'الوضع الليلي',
        'settings.notifications': 'الإشعارات',
        'settings.language': 'اللغة',
        'settings.logout': 'تسجيل الخروج',
        'settings.version': 'Troll Army v28.0',
        'settings.tge': 'TGE: مايو 2026',
        'settings.notSet': 'غير محدد',
        'settings.connected': 'متصل',
        'settings.notConnected': 'غير متصل',
        'solanaWallet.title': 'ربط محفظة Solana',
        'solanaWallet.desc': 'أدخل عنوان محفظة TROLL Solana الخاصة بك لإكمال المهمة الأولى.',
        'solanaWallet.placeholder': 'GzR...kLp',
        'solanaWallet.invalid': 'يجب أن يكون العنوان 32-44 حرفاً',
        'solanaWallet.valid': 'عنوان صالح',
        'solanaWallet.save': 'حفظ ومتابعة',
        'solanaWallet.cancel': 'إلغاء',
        'solanaWallet.success': 'تم حفظ المحفظة بنجاح!',
        'admin.title': 'لوحة المشرف',
        'admin.authenticate': 'مصادقة المشرف',
        'admin.password': 'أدخل كلمة مرور المشرف',
        'admin.verify': 'تحقق',
        'admin.cancel': 'إلغاء',
        'admin.dashboard': 'لوحة التحكم',
        'admin.pendingDeposits': 'إيداعات معلقة',
        'admin.pendingWithdrawals': 'سحوبات معلقة',
        'admin.users': 'إدارة المستخدمين',
        'admin.broadcast': 'بث رسالة',
        'admin.totalUsers': 'إجمالي المستخدمين',
        'admin.pending': 'معلق',
        'admin.premium': 'بريميوم',
        'admin.search': 'بحث بمعرف المستخدم أو المحفظة',
        'admin.searchBtn': 'بحث',
        'admin.addBalance': 'إضافة رصيد',
        'admin.removeBalance': 'خصم رصيد',
        'admin.blockUser': 'حظر السحب',
        'admin.blocked': 'محظور',
        'admin.approve': 'موافقة',
        'admin.reject': 'رفض',
        'admin.reason': 'سبب الرفض',
        'admin.broadcastMessage': 'رسالة البث',
        'admin.targetAll': 'جميع المستخدمين',
        'admin.targetBot': 'البوت فقط',
        'admin.targetApp': 'التطبيق فقط',
        'admin.send': 'إرسال البث',
        'admin.success': 'تمت العملية بنجاح!',
        'admin.error': 'فشلت العملية',
        'toast.copied': 'تم النسخ إلى الحافظة!',
        'toast.success': 'تم بنجاح!',
        'toast.error': 'خطأ!',
        'toast.info': 'معلومة',
        'guest.mode': 'وضع الزائر - قم بربط تيليجرام للوصول الكامل',
        'logout.confirm': 'هل أنت متأكد من تسجيل الخروج؟'
    }
};

function t(key, params = {}) {
    let text = translations[currentLanguage]?.[key] || translations.en[key] || key;
    Object.keys(params).forEach(k => { text = text.replace(`{${k}}`, params[k]); });
    return text;
}

// ============================================================================
// SECTION 10: ADMIN SESSION PERSISTENCE
// ============================================================================

function saveAdminSession() {
    if (adminAuthenticated && adminAuthToken) {
        const sessionData = {
            authenticated: true,
            token: adminAuthToken,
            expiry: Date.now() + (24 * 60 * 60 * 1000)
        };
        localStorage.setItem('troll_admin_session', JSON.stringify(sessionData));
        console.log('✅ Admin session saved');
    }
}

function loadAdminSession() {
    try {
        const saved = localStorage.getItem('troll_admin_session');
        if (saved) {
            const session = JSON.parse(saved);
            if (session.expiry > Date.now()) {
                adminAuthenticated = session.authenticated;
                adminAuthToken = session.token;
                console.log('✅ Admin session restored');
                return true;
            } else {
                localStorage.removeItem('troll_admin_session');
            }
        }
    } catch (e) {
        console.error('Error loading admin session:', e);
    }
    return false;
}

function clearAdminSession() {
    localStorage.removeItem('troll_admin_session');
    adminAuthenticated = false;
    adminAuthToken = null;
    console.log('🔒 Admin session cleared');
}

// ============================================================================
// SECTION 11: API CALL
// ============================================================================

async function apiCall(endpoint, method = 'GET', body = null, requiresAuth = false) {
    const options = { 
        method: method, 
        headers: { 'Content-Type': 'application/json' } 
    };
    
    if (requiresAuth && adminAuthToken) {
        options.headers['Authorization'] = `Bearer ${adminAuthToken}`;
    }
    
    if (body) options.body = JSON.stringify(body);
    
    try {
        const response = await fetch('/api' + endpoint, options);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// SECTION 12: LOAD CONFIG
// ============================================================================

async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        appConfig = await response.json();
        if (appConfig.firebaseConfig && typeof firebase !== 'undefined') {
            if (!firebase.apps.length) firebase.initializeApp(appConfig.firebaseConfig);
            db = firebase.firestore();
            console.log('🔥 Firebase ready');
        }
        return true;
    } catch (error) {
        console.error('Config error:', error);
        return false;
    }
}

// ============================================================================
// SECTION 13: COINGECKO LIVE PRICES
// ============================================================================

let lastPriceFetch = 0;

async function fetchLivePrices(force = false) {
    const now = Date.now();
    if (!force && lastPriceFetch && (now - lastPriceFetch) < 300000) return;
    
    console.log('🔄 Fetching CoinGecko prices...');
    
    try {
        const allCoins = [...ALL_ASSETS, ...MEME_COINS];
        const ids = allCoins.map(c => {
            if (c.symbol === 'TROLL') return 'troll-2';
            if (c.symbol === 'BTC') return 'bitcoin';
            if (c.symbol === 'ETH') return 'ethereum';
            if (c.symbol === 'BNB') return 'binancecoin';
            if (c.symbol === 'SOL') return 'solana';
            if (c.symbol === 'DOGE') return 'dogecoin';
            if (c.symbol === 'SHIB') return 'shiba-inu';
            if (c.symbol === 'PEPE') return 'pepe';
            if (c.symbol === 'BONK') return 'bonk';
            if (c.symbol === 'WIF') return 'dogwifcoin';
            return '';
        }).filter(id => id).join(',');
        
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
        const res = await fetch(url);
        const data = await res.json();
        
        allCoins.forEach(coin => {
            let coingeckoId = '';
            if (coin.symbol === 'TROLL') coingeckoId = 'troll-2';
            else if (coin.symbol === 'BTC') coingeckoId = 'bitcoin';
            else if (coin.symbol === 'ETH') coingeckoId = 'ethereum';
            else if (coin.symbol === 'BNB') coingeckoId = 'binancecoin';
            else if (coin.symbol === 'SOL') coingeckoId = 'solana';
            else if (coin.symbol === 'DOGE') coingeckoId = 'dogecoin';
            else if (coin.symbol === 'SHIB') coingeckoId = 'shiba-inu';
            else if (coin.symbol === 'PEPE') coingeckoId = 'pepe';
            else if (coin.symbol === 'BONK') coingeckoId = 'bonk';
            else if (coin.symbol === 'WIF') coingeckoId = 'dogwifcoin';
            
            if (coingeckoId && data[coingeckoId]) {
                cryptoPrices[coin.symbol] = {
                    price: data[coingeckoId].usd,
                    change: data[coingeckoId].usd_24h_change || 0
                };
            }
        });
        
        if (!cryptoPrices['TROLL']) {
            cryptoPrices['TROLL'] = { price: CONFIG.TROLL_PRICE_FALLBACK, change: 0 };
        }
        
        lastPriceFetch = now;
        
        if (currentPage === 'wallet') {
            renderAssets();
            renderTopCryptos();
            renderMemeCoins();
            updateTotalBalance();
        }
    } catch (error) {
        console.error('Price error:', error);
        cryptoPrices['TROLL'] = { price: CONFIG.TROLL_PRICE_FALLBACK, change: 0 };
    }
}

// ============================================================================
// SECTION 14: TELEGRAM USER DETECTION
// ============================================================================

async function waitForTelegramUserData(maxAttempts = 15, delayMs = 200) {
    console.log('⏳ Waiting for Telegram user data...');
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (tg) {
            tg.ready();
            tg.expand();
            
            if (tg.initDataUnsafe?.user?.id) {
                const user = tg.initDataUnsafe.user;
                console.log('✅ Found user:', user.id);
                return {
                    id: user.id.toString(),
                    firstName: user.first_name || 'Troll',
                    lastName: user.last_name || '',
                    username: user.username || '',
                    initData: buildInitDataFromUnsafe(tg.initDataUnsafe)
                };
            }
            
            if (tg.initData) {
                try {
                    const params = new URLSearchParams(tg.initData);
                    const userJson = params.get('user');
                    if (userJson) {
                        const user = JSON.parse(decodeURIComponent(userJson));
                        if (user?.id) {
                            console.log('✅ Found user in initData:', user.id);
                            return {
                                id: user.id.toString(),
                                firstName: user.first_name || 'Troll',
                                lastName: user.last_name || '',
                                username: user.username || '',
                                initData: tg.initData
                            };
                        }
                    }
                } catch (e) {}
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    
    console.log('❌ No Telegram user found');
    return null;
}

function buildInitDataFromUnsafe(unsafe) {
    if (!unsafe) return '';
    const data = { query_id: unsafe.query_id, user: JSON.stringify(unsafe.user), auth_date: unsafe.auth_date, hash: unsafe.hash };
    return Object.keys(data).filter(k => data[k]).map(k => `${k}=${encodeURIComponent(data[k])}`).join('&');
}

function getReferralFromUrl() {
    if (tg?.initDataUnsafe?.start_param) return tg.initDataUnsafe.start_param;
    const params = new URLSearchParams(window.location.search);
    return params.get('startapp') || params.get('ref') || null;
}

// ============================================================================
// SECTION 15: USER INITIALIZATION (WITH NOTIFICATIONS MERGE)
// ============================================================================

async function initUser() {
    console.log('🚀 Initializing user...');
    
    const telegramUser = await waitForTelegramUserData(15, 200);
    
    if (!telegramUser) {
        console.log('❌ No Telegram user - guest mode');
        await createGuestUser();
        return;
    }
    
    try {
        const response = await fetch('/api/init-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: telegramUser.initData })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Authenticated:', data.userId);
            
            currentUser = data.userData;
            currentUserId = data.userId;
            isGuest = false;
            
            // Merge local notifications with Firebase notifications
            const localData = localStorage.getItem('troll_user_data');
            if (localData) {
                try {
                    const localUser = JSON.parse(localData);
                    if (localUser.notifications && localUser.notifications.length > 0) {
                        const localNotifMap = new Map();
                        localUser.notifications.forEach(n => localNotifMap.set(n.id, n));
                        
                        currentUser.notifications = currentUser.notifications.map(n => {
                            const localNotif = localNotifMap.get(n.id);
                            if (localNotif && localNotif.read) {
                                return { ...n, read: true };
                            }
                            return n;
                        });
                        
                        const firebaseIds = new Set(currentUser.notifications.map(n => n.id));
                        const missingNotifs = localUser.notifications.filter(n => !firebaseIds.has(n.id));
                        currentUser.notifications = [...missingNotifs, ...currentUser.notifications];
                        
                        console.log('✅ Notifications merged: Firebase + Local');
                    }
                } catch (e) {
                    console.error('Error merging notifications:', e);
                }
            }
            
            localStorage.setItem('troll_user_id', data.userId);
            localStorage.setItem('troll_user_data', JSON.stringify(currentUser));
            
            const refCode = getReferralFromUrl();
            if (refCode && refCode !== currentUserId) {
                await processReferral(refCode);
            }
            
            hideAllScreens();
            showMainApp();
            updateUI();
            checkAdmin();
            loadAdminSession();
            loadBroadcasts();
            updateNotificationBadge();
            
            showToast('Welcome ' + data.userData.userName + '! +' + data.userData.balances.TROLL + ' TROLL', 'success');
        } else {
            await createGuestUser();
        }
    } catch (error) {
        console.error('❌ Server error:', error);
        await createGuestUser();
    }
}

// ============================================================================
// SECTION 16: REFERRAL PROCESSING
// ============================================================================

async function processReferral(refCode) {
    if (!refCode || refCode === currentUserId || currentUser.referredBy) return;
    
    try {
        const response = await apiCall('/referral', 'POST', { referrerId: refCode, newUserId: currentUserId });
        
        if (response.success) {
            currentUser.referredBy = refCode;
            currentUser.balances.TROLL += CONFIG.REFERRAL_BONUS;
            currentUser.referralEarnings += CONFIG.REFERRAL_BONUS;
            currentUser.totalEarned += CONFIG.REFERRAL_BONUS;
            
            await saveUserData();
            await updateMissionsProgress();
            
            // ✅ FIXED: Update mission UI instantly after referral
            if (currentPage === 'airdrop') renderMissionsUI();
            
            addNotification({
                type: 'referral',
                title: '🎉 New Referral!',
                message: `+${CONFIG.REFERRAL_BONUS} TROLL from referral!`
            });
            
            showToast('🎉 +' + CONFIG.REFERRAL_BONUS + ' TROLL from referral!', 'success');
        }
    } catch (error) {
        console.error('❌ Referral error:', error);
    }
}

// ============================================================================
// SECTION 17: GUEST USER
// ============================================================================

async function createGuestUser() {
    const guestId = 'guest_' + Date.now();
    
    const guestData = {
        userId: guestId,
        userName: 'Guest',
        balances: { TROLL: 0, BNB: 0, SOL: 0, ETH: 0, TRON: 0 },
        inviteCount: 0,
        referralEarnings: 0,
        premium: false,
        avatar: '🧌',
        withdrawalUnlocked: false,
        withdrawBlocked: false,
        claimedMilestones: [],
        settings: { solanaWallet: null },
        withdrawalMissions: getDefaultMissions(),
        notifications: [],
        transactions: [],
        isGuest: true
    };
    
    currentUser = guestData;
    currentUserId = guestId;
    isGuest = true;
    
    localStorage.setItem('troll_user_id', guestId);
    localStorage.setItem('troll_user_data', JSON.stringify(guestData));
    
    try {
        await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: guestId, userData: guestData })
        });
    } catch (e) {}
    
    hideAllScreens();
    showMainApp();
    updateUI();
    showToast(t('guest.mode'), 'info');
}

// ============================================================================
// SECTION 18: UI HELPERS
// ============================================================================

function hideAllScreens() {
    ['onboardingScreen', 'splashScreen'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

function showMainApp() {
    const main = document.getElementById('mainApp');
    const nav = document.getElementById('bottomNav');
    if (main) main.style.display = 'block';
    if (nav) nav.style.display = 'flex';
}

function checkAdmin() {
    if (currentUserId === appConfig.adminId) {
        const header = document.querySelector('.header-actions');
        if (header && !document.getElementById('adminCrownBtn')) {
            const btn = document.createElement('button');
            btn.id = 'adminCrownBtn';
            btn.className = 'icon-btn';
            btn.innerHTML = '<i class="fa-solid fa-crown" style="color: gold;"></i>';
            btn.onclick = showAdminAuthModal;
            header.insertBefore(btn, header.firstChild);
        }
    }
}

// ============================================================================
// SECTION 19: MAIN UI UPDATE
// ============================================================================

function updateUI() {
    if (!currentUser) return;
    
    document.getElementById('userName').textContent = currentUser.userName || 'User';
    document.getElementById('userIdDisplay').textContent = 'ID: ' + (currentUserId || '').slice(-8);
    
    const avatarEl = document.getElementById('userAvatar');
    if (avatarEl) {
        avatarEl.innerHTML = currentUser.premium ? getPremiumAvatarSVG() : getDefaultAvatarSVG();
        if (currentUser.premium) avatarEl.classList.add('avatar-premium');
    }
    
    document.getElementById('trollBalance').textContent = (currentUser.balances.TROLL || 0).toLocaleString();
    document.getElementById('totalInvites').textContent = currentUser.inviteCount || 0;
    document.getElementById('trollEarned').textContent = (currentUser.referralEarnings || 0).toLocaleString();
    document.getElementById('inviteLink').value = getReferralLink();
    
    updateTotalBalance();
    updateSettingsUI();
    
    if (currentPage === 'wallet') {
        renderAssets();
        renderTopCryptos();
        renderMemeCoins();
    } else if (currentPage === 'airdrop') {
        renderMissionsUI();
        renderMilestones();
    }
}

function updateTotalBalance() {
    let total = 0;
    ALL_ASSETS.forEach(asset => {
        const balance = currentUser.balances[asset.symbol] || 0;
        const price = cryptoPrices[asset.symbol]?.price || 0;
        total += balance * price;
    });
    
    const totalEl = document.getElementById('totalBalance');
    if (totalEl) totalEl.textContent = '$' + total.toFixed(2);
    
    const trollBalance = currentUser.balances.TROLL || 0;
    const trollPrice = cryptoPrices['TROLL']?.price || CONFIG.TROLL_PRICE_FALLBACK;
    const usdEl = document.getElementById('trollUsdValue');
    if (usdEl) usdEl.textContent = (trollBalance * trollPrice).toFixed(2);
}

function getDefaultAvatarSVG() {
    return `<svg viewBox="0 0 100 100" width="40" height="40">
        <defs><radialGradient id="avGrad" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#FFE44D"/><stop offset="100%" stop-color="#FFD700"/></radialGradient></defs>
        <circle cx="50" cy="50" r="48" fill="url(#avGrad)" stroke="#E6C200" stroke-width="2"/>
        <path d="M 28 65 Q 45 85, 70 60 Q 78 50, 72 45 Q 55 65, 28 58 Z" fill="#2C1810"/>
        <ellipse cx="35" cy="40" rx="9" ry="11" fill="white" stroke="#2C1810" stroke-width="1.5"/><circle cx="38" cy="40" r="4" fill="#2C1810"/>
        <ellipse cx="65" cy="42" rx="9" ry="8" fill="white" stroke="#2C1810" stroke-width="1.5"/><circle cx="62" cy="43" r="3.5" fill="#2C1810"/>
        <path d="M 24 28 Q 35 20, 46 28" stroke="#2C1810" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M 54 30 Q 65 24, 76 30" stroke="#2C1810" stroke-width="3" fill="none" stroke-linecap="round"/>
    </svg>`;
}

function getPremiumAvatarSVG() {
    return `<svg viewBox="0 0 100 100" width="40" height="40">
        <defs><radialGradient id="premGrad" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#FFE44D"/><stop offset="100%" stop-color="#FFD700"/></radialGradient></defs>
        <circle cx="50" cy="50" r="48" fill="url(#premGrad)" stroke="#FFD700" stroke-width="3"/>
        <path d="M 28 65 Q 45 85, 70 60 Q 78 50, 72 45 Q 55 65, 28 58 Z" fill="#2C1810"/>
        <ellipse cx="35" cy="40" rx="9" ry="11" fill="white" stroke="#2C1810" stroke-width="1.5"/><circle cx="38" cy="40" r="4" fill="#FF0000"/>
        <ellipse cx="65" cy="42" rx="9" ry="8" fill="white" stroke="#2C1810" stroke-width="1.5"/><circle cx="62" cy="43" r="3.5" fill="#FF0000"/>
        <path d="M 24 28 Q 35 20, 46 28" stroke="#2C1810" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M 54 30 Q 65 24, 76 30" stroke="#2C1810" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M 30 18 L 38 8 L 50 16 L 62 8 L 70 18 Z" fill="#FFD700" stroke="#DAA520" stroke-width="1.5"/>
        <circle cx="40" cy="12" r="2.5" fill="#FF0000"/><circle cx="50" cy="18" r="2.5" fill="#00FF00"/><circle cx="60" cy="12" r="2.5" fill="#0000FF"/>
    </svg>`;
}

function updateSettingsUI() {
    const avatarEl = document.getElementById('settingsAvatar');
    if (avatarEl) {
        avatarEl.innerHTML = currentUser.premium ? getPremiumAvatarSVG() : getDefaultAvatarSVG();
    }
    
    document.getElementById('settingsUserName').textContent = currentUser.userName || 'User';
    document.getElementById('settingsUserId').textContent = 'ID: ' + currentUserId;
    
    const wallet = currentUser.settings?.solanaWallet;
    document.getElementById('currentSolanaWallet').textContent = wallet ? wallet.slice(0, 8) + '...' + wallet.slice(-4) : t('settings.notSet');
    
    const tonEl = document.getElementById('tonWalletStatus');
    const tonLabel = document.getElementById('tonWalletLabel');
    if (tonEl) {
        if (tonConnected && tonWalletAddress) {
            tonEl.textContent = tonWalletAddress.slice(0, 6) + '...' + tonWalletAddress.slice(-6);
            tonEl.style.color = '#2ecc71';
            if (tonLabel) tonLabel.textContent = 'TON Wallet (Tap to disconnect)';
        } else {
            tonEl.textContent = t('settings.notConnected');
            tonEl.style.color = '';
            if (tonLabel) tonLabel.textContent = 'Connect TON Wallet';
        }
    }
}

function getReferralLink() {
    if (!currentUserId || currentUserId.startsWith('guest_')) return CONFIG.BOT_LINK;
    return CONFIG.BOT_LINK + '?startapp=' + currentUserId;
}

// ============================================================================
// SECTION 20: RENDER FUNCTIONS
// ============================================================================

function renderAssets() {
    const container = document.getElementById('assetsList');
    if (!container) return;
    
    let html = '';
    
    ALL_ASSETS.forEach(asset => {
        const balance = currentUser.balances[asset.symbol] || 0;
        const price = cryptoPrices[asset.symbol]?.price || 0;
        const value = balance * price;
        
        html += `<div class="asset-item" onclick="showAssetDetails('${asset.symbol}')">
            <div class="asset-left">
                <img src="${ICONS[asset.symbol] || ICONS.TROLL}" class="asset-icon-img">
                <div class="asset-info">
                    <h4>${asset.name}</h4>
                    <p>${asset.symbol}</p>
                </div>
            </div>
            <div class="asset-right">
                <div class="asset-balance">${balance.toLocaleString()} ${asset.symbol}</div>
                <div class="asset-value">$${value.toFixed(2)}</div>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
}

function renderTopCryptos() {
    const container = document.getElementById('topCryptoList');
    if (!container) return;
    
    const topCoins = ALL_ASSETS.filter(a => ['TROLL', 'BTC', 'ETH', 'BNB', 'SOL'].includes(a.symbol));
    
    let html = '';
    
    topCoins.forEach(coin => {
        const data = cryptoPrices[coin.symbol] || { price: 0, change: 0 };
        const changeClass = data.change >= 0 ? 'positive' : 'negative';
        const changeSymbol = data.change >= 0 ? '+' : '';
        const decimals = coin.symbol === 'TROLL' ? 5 : 2;
        
        html += `<div class="crypto-item" onclick="showCryptoDetails('${coin.symbol}')">
            <div class="crypto-left">
                <img src="${ICONS[coin.symbol]}" class="crypto-icon-img">
                <div class="crypto-info">
                    <h4>${coin.name}</h4>
                    <p>${coin.symbol}</p>
                </div>
            </div>
            <div class="crypto-right">
                <div class="crypto-price">$${data.price.toFixed(decimals)}</div>
                <div class="crypto-change ${changeClass}">${changeSymbol}${data.change.toFixed(1)}%</div>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
}

function renderMemeCoins() {
    const container = document.getElementById('memeCoinList');
    if (!container) return;
    
    let html = '';
    
    MEME_COINS.forEach(coin => {
        const data = cryptoPrices[coin.symbol] || { price: 0, change: 0 };
        const changeClass = data.change >= 0 ? 'positive' : 'negative';
        const changeSymbol = data.change >= 0 ? '+' : '';
        
        html += `<div class="crypto-item" onclick="showCryptoDetails('${coin.symbol}')">
            <div class="crypto-left">
                <img src="${ICONS[coin.symbol]}" class="crypto-icon-img">
                <div class="crypto-info">
                    <h4>${coin.name}</h4>
                    <p>${coin.symbol}</p>
                </div>
            </div>
            <div class="crypto-right">
                <div class="crypto-price">$${data.price.toFixed(8)}</div>
                <div class="crypto-change ${changeClass}">${changeSymbol}${data.change.toFixed(1)}%</div>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
}

function renderMissionsUI() {
    const container = document.getElementById('withdrawalLockCard');
    if (!container) return;
    
    if (currentUser.premium) {
        container.innerHTML = `<div class="premium-unlocked-card"><div class="premium-icon-large">😏</div><h3>${t('premium.unlocked')}</h3><p>Instant withdrawal access!</p></div>`;
        return;
    }
    
    const m = currentUser.withdrawalMissions;
    
    let html = `
        <div class="lock-header">
            <i class="fa-solid fa-${currentUser.withdrawalUnlocked ? 'unlock' : 'lock'}"></i>
            <span>${currentUser.withdrawalUnlocked ? '✅ ' + t('withdrawal.unlocked') : '🔒 ' + t('withdrawal.locked')}</span>
        </div>
        <div class="missions-list-vertical">`;
    
    // Mission 1
    html += `<div class="mission-card ${m.mission1.completed ? 'completed' : ''}">
        <div class="mission-icon">${m.mission1.completed ? '✅' : '1️⃣'}</div>
        <div class="mission-content">
            <h4>${MISSIONS.mission1.title}</h4>`;
    if (currentUser.settings?.solanaWallet) {
        html += `<p>Wallet: ${currentUser.settings.solanaWallet.slice(0, 8)}...</p>`;
    } else {
        html += `<p>${MISSIONS.mission1.desc}</p>`;
    }
    if (!m.mission1.completed) {
        html += `<button class="mission-action-btn" onclick="showSolanaWalletModal()">${t('mission.addWallet')}</button>`;
    }
    html += `</div></div>`;
    
    // Mission 2
    if (m.mission2.revealed) {
        const prog = (m.mission2.currentAmount / 12500) * 100;
        html += `<div class="mission-card ${m.mission2.completed ? 'completed' : ''}">
            <div class="mission-icon">${m.mission2.completed ? '✅' : '2️⃣'}</div>
            <div class="mission-content">
                <h4>${MISSIONS.mission2.title}</h4>
                <p>${m.mission2.currentAmount.toLocaleString()} / 12,500 TROLL</p>
                <div class="progress-bar small"><div class="progress-fill" style="width:${prog}%"></div></div>
                <p class="mission-hint">💡 ${MISSIONS.mission2.hint}</p>
            </div>
        </div>`;
    } else {
        html += `<div class="mission-card mystery"><div class="mission-icon">❓</div><div class="mission-content"><h4>Mission 2: ???</h4><p>${t('mission.revealLater')}</p></div></div>`;
    }
    
    // Mission 3
    if (m.mission3.revealed) {
        const prog = (m.mission3.currentNewReferrals / 12) * 100;
        html += `<div class="mission-card ${m.mission3.completed ? 'completed' : ''}">
            <div class="mission-icon">${m.mission3.completed ? '✅' : '3️⃣'}</div>
            <div class="mission-content">
                <h4>${MISSIONS.mission3.title}</h4>
                <p>${m.mission3.currentNewReferrals} / 12 new referrals</p>
                <div class="progress-bar small"><div class="progress-fill" style="width:${prog}%"></div></div>
                <p class="mission-hint">💡 ${MISSIONS.mission3.hint}</p>
            </div>
        </div>`;
    } else {
        html += `<div class="mission-card mystery"><div class="mission-icon">❓</div><div class="mission-content"><h4>Mission 3: ???</h4><p>${t('mission.revealLater')}</p></div></div>`;
    }
    
    // Mission 4
if (m.mission4.revealed) {
    const bnb = currentUser.balances.BNB || 0;
    const sol = currentUser.balances.SOL || 0;
    html += `<div class="mission-card ${m.mission4.completed ? 'completed' : ''}">
        <div class="mission-icon">${m.mission4.completed ? '✅' : '4️⃣'}</div>
        <div class="mission-content">
            <h4>${MISSIONS.mission4.title}</h4>
            <p>BNB: ${bnb.toFixed(4)}/0.025 | SOL: ${sol.toFixed(4)}/0.25</p>
            <p class="mission-hint">💡 ${MISSIONS.mission4.hint}</p>
        </div>
    </div>`;
} else if (m.mission3.completed) {
    const revealDate = new Date(m.mission4.revealDate);
    const now = new Date();
    const daysLeft = Math.max(0, Math.ceil((revealDate - now) / (1000 * 60 * 60 * 24)));
    html += `<div class="mission-card mystery-timer">
        <div class="mission-icon">
            <i class="fa-regular fa-clock" style="animation: timerRotate 3s linear infinite;"></i>
        </div>
        <div class="mission-content">
            <h4>Final Mystery Mission</h4>
            <p>${t('mission.waitDays', {days: daysLeft})}</p>
            <div class="timer-progress-bar"><div class="timer-fill" style="width:${((20 - daysLeft) / 20) * 100}%"></div></div>
        </div>
    </div>`;
} else {
    html += `<div class="mission-card mystery"><div class="mission-icon">❓</div><div class="mission-content"><h4>Mission 4: ???</h4><p>${t('mission.revealLater')}</p></div></div>`;
}

html += `</div>`;
container.innerHTML = html;
}

function renderMilestones() {
    const container = document.getElementById('milestonesList');
    if (!container) return;
    
    let html = '';
    
    MILESTONES.forEach(m => {
        const progress = Math.min(((currentUser.inviteCount || 0) / m.referrals) * 100, 100);
        const claimed = currentUser.claimedMilestones?.includes(m.referrals);
        const canClaim = (currentUser.inviteCount >= m.referrals) && !claimed && !m.isSpecial;
        
        html += `<div class="milestone-item ${claimed ? 'claimed' : ''}">
            <div class="milestone-header">
                <span>${m.title}</span>
                <span>${m.isSpecial ? '🎁 Mystery Box' : m.reward.toLocaleString() + ' TROLL'}</span>
            </div>
            <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
            <div class="progress-text">${currentUser.inviteCount || 0}/${m.referrals}</div>`;
        
        if (canClaim) {
            html += `<button class="claim-btn" onclick="claimMilestone(${m.referrals})">Claim</button>`;
        }
        if (claimed) {
            html += `<p style="color:#2ecc71;text-align:center;">✓ Claimed</p>`;
        }
        html += `</div>`;
    });
    
    container.innerHTML = html;
}

// ============================================================================
// SECTION 21: DATA PERSISTENCE
// ============================================================================

async function saveUserData() {
    localStorage.setItem('troll_user_data', JSON.stringify(currentUser));
    if (!isGuest) {
        await apiCall('/users/' + currentUserId, 'PATCH', { updates: currentUser });
    }
    await updateMissionsProgress();
}

// ============================================================================
// SECTION 22: MISSIONS PROGRESS
// ============================================================================

async function updateMissionsProgress() {
    const m = currentUser.withdrawalMissions;
    let changed = false;
    
    if (!m.mission1.completed && currentUser.settings?.solanaWallet) {
        m.mission1.completed = true;
        m.mission2.revealed = true;
        changed = true;
    }
    
    if (m.mission2.revealed && !m.mission2.completed) {
        m.mission2.currentAmount = currentUser.referralEarnings || 0;
        if (m.mission2.currentAmount >= m.mission2.requiredAmount) {
            m.mission2.completed = true;
            m.mission3.revealed = true;
            m.mission3.referralsAtStart = currentUser.inviteCount || 0;
            changed = true;
        }
    }
    
    if (m.mission3.revealed && !m.mission3.completed) {
        m.mission3.currentNewReferrals = Math.max(0, (currentUser.inviteCount || 0) - (m.mission3.referralsAtStart || 0));
        if (m.mission3.currentNewReferrals >= m.mission3.requiredReferrals) {
            m.mission3.completed = true;
            const revealDate = new Date();
            revealDate.setDate(revealDate.getDate() + 20);
            m.mission4.revealDate = revealDate.toISOString();
            changed = true;
        }
    }
    
    if (m.mission3.completed && !m.mission4.revealed) {
        if (new Date() >= new Date(m.mission4.revealDate)) {
            m.mission4.revealed = true;
            changed = true;
        }
    }
    
    if (m.mission4.revealed && !m.mission4.completed) {
        const bnb = currentUser.balances.BNB || 0;
        const sol = currentUser.balances.SOL || 0;
        if (bnb >= m.mission4.requiredBNB || sol >= m.mission4.requiredSOL) {
            m.mission4.completed = true;
            changed = true;
        }
    }
    
    const allDone = m.mission1.completed && m.mission2.completed && m.mission3.completed && m.mission4.completed;
    
    if (allDone && !currentUser.withdrawalUnlocked) {
        currentUser.withdrawalUnlocked = true;
        changed = true;
        addNotification({
            type: 'mission',
            title: '🎉 Congratulations!',
            message: t('withdrawal.unlocked')
        });
        celebrateUnlock();
    }
    
    if (changed) {
        await saveUserData();
        // ✅ FIXED: Update mission UI instantly when progress changes
        if (currentPage === 'airdrop') renderMissionsUI();
    }
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
    showToast(t('withdrawal.unlocked'), 'success');
}

// ============================================================================
// SECTION 23: SOLANA WALLET MODAL (FIXED - WORKS FROM BOTH MISSIONS AND SETTINGS)
// ============================================================================

function showSolanaWalletModal() {
    console.log('🔐 Opening Solana Wallet Modal');
    
    let modal = document.getElementById('solanaWalletModal');
    
    // Create modal if it doesn't exist
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'solanaWalletModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="close-btn" onclick="closeModal('solanaWalletModal')">&times;</button>
                <div class="modal-icon">🔑</div>
                <h2 id="solanaModalTitle">${t('solanaWallet.title')}</h2>
                <p class="modal-desc" id="solanaModalDesc">${t('solanaWallet.desc')}</p>
                
                <div class="input-group">
                    <label>Solana Wallet Address</label>
                    <input type="text" id="solanaWalletInput" placeholder="${t('solanaWallet.placeholder')}" autocomplete="off">
                    <div id="solanaWalletValidation" class="validation-hint"></div>
                </div>
                
                <div class="modal-actions">
                    <button class="modal-action-btn primary" id="saveSolanaWalletBtn" onclick="submitSolanaWallet()" disabled>
                        <i class="fa-regular fa-save"></i> ${t('solanaWallet.save')}
                    </button>
                    <button class="modal-action-btn secondary" onclick="closeModal('solanaWalletModal')">
                        <i class="fa-regular fa-times"></i> ${t('solanaWallet.cancel')}
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        const input = document.getElementById('solanaWalletInput');
        const validation = document.getElementById('solanaWalletValidation');
        const saveBtn = document.getElementById('saveSolanaWalletBtn');
        
        if (input) {
            input.addEventListener('input', function() {
                const value = this.value.trim();
                if (value.length >= 32 && value.length <= 44) {
                    validation.textContent = '✓ ' + t('solanaWallet.valid');
                    validation.className = 'validation-hint valid';
                    saveBtn.disabled = false;
                } else {
                    validation.textContent = t('solanaWallet.invalid');
                    validation.className = 'validation-hint invalid';
                    saveBtn.disabled = true;
                }
            });
            
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && !saveBtn.disabled) {
                    submitSolanaWallet();
                }
            });
        }
    }
    
    // Update translations
    const titleEl = document.getElementById('solanaModalTitle');
    const descEl = document.getElementById('solanaModalDesc');
    const saveBtnEl = document.getElementById('saveSolanaWalletBtn');
    const inputEl = document.getElementById('solanaWalletInput');
    const validationEl = document.getElementById('solanaWalletValidation');
    
    if (titleEl) titleEl.textContent = t('solanaWallet.title');
    if (descEl) descEl.textContent = t('solanaWallet.desc');
    if (saveBtnEl) saveBtnEl.innerHTML = `<i class="fa-regular fa-save"></i> ${t('solanaWallet.save')}`;
    if (inputEl) inputEl.placeholder = t('solanaWallet.placeholder');
    if (validationEl) validationEl.textContent = '';
    if (inputEl) inputEl.value = '';
    if (saveBtnEl) saveBtnEl.disabled = true;
    
    modal.classList.add('show');
    if (inputEl) {
        inputEl.focus();
    }
}

function submitSolanaWallet() {
    const input = document.getElementById('solanaWalletInput');
    if (!input) return;
    
    const address = input.value.trim();
    
    if (address.length >= 32 && address.length <= 44) {
        if (!currentUser.settings) currentUser.settings = {};
        currentUser.settings.solanaWallet = address;
        saveUserData();
        updateMissionsProgress();
        updateUI();
        if (currentPage === 'airdrop') renderMissionsUI();
        closeModal('solanaWalletModal');
        showToast(t('solanaWallet.success'), 'success');
        
        addNotification({
            type: 'mission',
            title: '✅ Mission 1 Complete!',
            message: 'Solana wallet added. Mission 2 unlocked!'
        });
    } else {
        showToast(t('solanaWallet.invalid'), 'error');
    }
}

// ============================================================================
// SECTION 24: PROFESSIONAL WITHDRAWAL MODAL (DEPOSIT-STYLE)
// ============================================================================

function showWithdrawModal() {
    console.log('💰 Opening Withdrawal Modal');
    
    let modal = document.getElementById('withdrawModal');
    
    // Create modal if it doesn't exist or recreate with new structure
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'withdrawModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    
    // Check if withdrawal is locked
    const isLocked = !currentUser.withdrawalUnlocked && !currentUser.premium;
    const isBlocked = currentUser.withdrawBlocked === true;
    
    // Calculate remaining missions if locked
    let remainingMissions = 0;
    if (!currentUser.withdrawalUnlocked && !currentUser.premium) {
        const m = currentUser.withdrawalMissions;
        if (!m.mission1.completed) remainingMissions++;
        if (!m.mission2.completed) remainingMissions++;
        if (!m.mission3.completed) remainingMissions++;
        if (!m.mission4.completed) remainingMissions++;
    }
    
    let modalHTML = '';
    
    if (isLocked || isBlocked) {
        // LOCKED MODAL - Professional style like deposit modal
        modalHTML = `
            <div class="modal-content">
                <button class="close-btn" onclick="closeModal('withdrawModal')">&times;</button>
                <div class="modal-icon">🔒</div>
                <h2>${t('withdrawal.locked.title')}</h2>
                <p class="modal-desc">${t('withdrawal.locked.message')}</p>
                
                <div class="withdraw-info">
                    <div class="info-row">
                        <i class="fa-regular fa-flag"></i>
                        <span>${remainingMissions} ${t('withdrawal.missions.left')}</span>
                    </div>
                    <div class="info-row">
                        <i class="fa-regular fa-clock"></i>
                        <span>Complete missions in Airdrop section</span>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="modal-action-btn primary" onclick="closeModal('withdrawModal'); showAirdrop();">
                        <i class="fa-regular fa-gift"></i> ${t('withdrawal.go.to.missions')}
                    </button>
                    <button class="modal-action-btn secondary" onclick="closeModal('withdrawModal')">
                        <i class="fa-regular fa-times"></i> Cancel
                    </button>
                </div>
            </div>
        `;
    } else {
        // UNLOCKED MODAL - Withdrawal form
        const balance = currentUser.balances.TROLL || 0;
        modalHTML = `
            <div class="modal-content">
                <button class="close-btn" onclick="closeModal('withdrawModal')">&times;</button>
                <div class="modal-icon">💸</div>
                <h2>${t('withdrawal.available.title')}</h2>
                
                <div class="input-group">
                    <label>${t('withdrawal.amount')}</label>
                    <input type="number" id="withdrawAmount" placeholder="10000" min="10000" max="${balance}">
                    <div class="info-row" style="margin-top: 5px;">
                        <i class="fa-regular fa-wallet"></i>
                        <span>${t('withdrawal.available.balance')}: ${balance.toLocaleString()} TROLL</span>
                    </div>
                </div>
                
                <div class="input-group">
                    <label>${t('withdrawal.address')}</label>
                    <input type="text" id="withdrawAddress" placeholder="GzR...kLp">
                </div>
                
                <div class="withdraw-info">
                    <div class="info-row">
                        <i class="fa-regular fa-clock"></i>
                        <span>Distribution: May 1, 2026</span>
                    </div>
                    <div class="info-row">
                        <i class="fa-regular fa-circle-info"></i>
                        <span>Make sure it's a valid TROLL Solana address</span>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="modal-action-btn primary" onclick="submitWithdraw()">
                        <i class="fa-regular fa-paper-plane"></i> ${t('withdrawal.submit')}
                    </button>
                    <button class="modal-action-btn secondary" onclick="closeModal('withdrawModal')">
                        <i class="fa-regular fa-times"></i> Cancel
                    </button>
                </div>
            </div>
        `;
    }
    
    modal.innerHTML = modalHTML;
    modal.classList.add('show');
}

// ============================================================================
// SECTION 25: NOTIFICATIONS SYSTEM (FULLY FIXED - NO STACKING)
// ============================================================================

function addNotification(notification) {
    if (!currentUser) return;
    if (!currentUser.notifications) currentUser.notifications = [];
    
    const newNotification = {
        id: Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        type: notification.type || 'info',
        title: notification.title || 'Notification',
        message: notification.message,
        read: false,
        timestamp: new Date().toISOString()
    };
    
    currentUser.notifications.unshift(newNotification);
    if (currentUser.notifications.length > 50) currentUser.notifications = currentUser.notifications.slice(0, 50);
    
    localStorage.setItem('troll_user_data', JSON.stringify(currentUser));
    updateNotificationBadge();
    
    console.log('✅ Notification added:', newNotification.title);
}

function updateNotificationBadge() {
    const badge = document.querySelector('.badge');
    if (badge && currentUser) {
        unreadNotifications = currentUser.notifications?.filter(n => !n.read).length || 0;
        badge.textContent = unreadNotifications;
        badge.style.display = unreadNotifications > 0 ? 'flex' : 'none';
    }
}

function renderNotifications() {
    const container = document.getElementById('notificationsList');
    if (!container || !currentUser) return;
    
    const notifications = currentUser.notifications || [];
    
    let controlsHTML = `
        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
            <button onclick="clearReadNotifications()" style="flex:1; padding:8px; background:rgba(46,204,113,0.1); border:1px solid rgba(46,204,113,0.2); border-radius:8px; color:#2ecc71; cursor:pointer;">
                <i class="fa-regular fa-trash-can"></i> ${t('notifications.clearRead')}
            </button>
            <button onclick="clearAllNotifications()" style="flex:1; padding:8px; background:rgba(231,76,60,0.1); border:1px solid rgba(231,76,60,0.2); border-radius:8px; color:#e74c3c; cursor:pointer;">
                <i class="fa-regular fa-bell-slash"></i> ${t('notifications.clearAll')}
            </button>
        </div>
    `;
    
    if (notifications.length === 0) {
        container.innerHTML = controlsHTML + `<div class="empty-state"><i class="fa-regular fa-bell-slash"></i><p>${t('notifications.empty')}</p></div>`;
        return;
    }
    
    let html = '';
    notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    notifications.forEach(n => {
        let date;
        if (n.timestamp?.toDate) {
            date = n.timestamp.toDate();
        } else if (n.timestamp?.seconds) {
            date = new Date(n.timestamp.seconds * 1000);
        } else if (typeof n.timestamp === 'string') {
            date = new Date(n.timestamp);
        } else {
            date = new Date();
        }
        
        if (isNaN(date.getTime())) {
            date = new Date();
        }
        
        const formattedDate = date.toLocaleString(currentLanguage === 'ar' ? 'ar-SA' : 'en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        let iconClass = 'fa-bell';
        let iconColor = 'info';
        if (n.type === 'referral') { iconClass = 'fa-users'; iconColor = 'referral'; }
        else if (n.type === 'deposit') { iconClass = 'fa-circle-down'; iconColor = 'deposit'; }
        else if (n.type === 'withdraw') { iconClass = 'fa-circle-up'; iconColor = 'withdraw'; }
        else if (n.type === 'broadcast') { iconClass = 'fa-bullhorn'; iconColor = 'broadcast'; }
        else if (n.type === 'mission') { iconClass = 'fa-trophy'; iconColor = 'mission'; }
        else if (n.type === 'milestone') { iconClass = 'fa-medal'; iconColor = 'milestone'; }
        
        html += `
            <div class="notification-item ${n.read ? '' : 'unread'}" onclick="markNotificationRead('${n.id}')">
                <div class="notification-header">
                    <span class="notification-icon ${iconColor}">
                        <i class="fa-regular ${iconClass}"></i>
                    </span>
                    <span class="notification-title">${escapeHtml(n.title)}</span>
                    <span class="notification-time">${formattedDate}</span>
                </div>
                <div class="notification-message" style="direction: ${currentLanguage === 'ar' ? 'rtl' : 'ltr'}; text-align: ${currentLanguage === 'ar' ? 'right' : 'left'}; word-break: break-word; white-space: normal;">
                    ${escapeHtml(n.message)}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = controlsHTML + html;
}

// Helper function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function markNotificationRead(notificationId) {
    if (!currentUser.notifications) return;
    const notification = currentUser.notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
        notification.read = true;
        unreadNotifications--;
        updateNotificationBadge();
        localStorage.setItem('troll_user_data', JSON.stringify(currentUser));
        renderNotifications();
    }
}

function clearReadNotifications() {
    if (!currentUser.notifications) return;
    const readCount = currentUser.notifications.filter(n => n.read).length;
    if (readCount === 0) { showToast('No read notifications', 'info'); return; }
    currentUser.notifications = currentUser.notifications.filter(n => !n.read);
    unreadNotifications = currentUser.notifications.length;
    updateNotificationBadge();
    localStorage.setItem('troll_user_data', JSON.stringify(currentUser));
    renderNotifications();
    showToast(`Cleared ${readCount} notifications`, 'success');
}

function clearAllNotifications() {
    if (!currentUser.notifications || currentUser.notifications.length === 0) return;
    if (confirm(t('notifications.clearAll') + '?')) {
        currentUser.notifications = [];
        unreadNotifications = 0;
        updateNotificationBadge();
        localStorage.setItem('troll_user_data', JSON.stringify(currentUser));
        renderNotifications();
        showToast('All notifications cleared', 'success');
    }
}

async function loadBroadcasts() {
    if (!db || !currentUser) return;
    
    try {
        const snapshot = await db.collection('broadcasts')
            .where('target', 'in', ['all', 'app'])
            .orderBy('sentAt', 'desc')
            .limit(10)
            .get();
        
        snapshot.forEach(doc => {
            const broadcast = doc.data();
            if (!broadcast.readBy || !broadcast.readBy.includes(currentUserId)) {
                addNotification({
                    type: 'broadcast',
                    title: '📢 Announcement',
                    message: broadcast.message
                });
                
                db.collection('broadcasts').doc(doc.id).update({
                    readBy: firebase.firestore.FieldValue.arrayUnion(currentUserId)
                }).catch(() => {});
            }
        });
    } catch (e) {
        console.error('Load broadcasts error:', e);
    }
}

// ============================================================================
// SECTION 26: MODAL FUNCTIONS
// ============================================================================

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('show');
}

function showModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('show');
}

function showDepositModal() {
    const modal = document.getElementById('depositModal');
    if (!modal) return;
    
    let currencySelect = document.getElementById('depositCurrencySelect');
    if (!currencySelect) {
        const container = modal.querySelector('.modal-content');
        // Remove existing transaction ID field if present
        const existingTxnField = document.getElementById('depositTxnIdGroup');
        if (existingTxnField) existingTxnField.remove();
        
        const selectHtml = `
            <div class="input-group">
                <label>${t('deposit.selectCurrency')}</label>
                <select id="depositCurrencySelect" class="currency-select">
                    ${DEPOSIT_CURRENCIES.map(c => `<option value="${c.symbol}">${c.name}</option>`).join('')}
                </select>
            </div>
            <div id="depositAddressContainer" style="display:none;">
                <div class="deposit-address-container">
                    <label>${t('deposit.address')}</label>
                    <div class="address-box">
                        <code id="depositAddress">Loading...</code>
                        <button onclick="copyDepositAddress()">
                            <i class="fa-regular fa-copy"></i>
                        </button>
                    </div>
                </div>
                <div class="deposit-info">
                    <div class="info-row"><i class="fa-regular fa-circle-check"></i> <span id="depositNetwork">-</span></div>
                    <div class="info-row"><i class="fa-regular fa-coins"></i> <span id="depositMinAmount">-</span></div>
                    <div class="info-row"><i class="fa-regular fa-shield"></i> <span>${t('deposit.warning')}</span></div>
                </div>
                <div class="modal-actions">
                    <button class="modal-action-btn primary" onclick="submitDepositRequest()">
                        <i class="fa-regular fa-paper-plane"></i> ${t('deposit.submit')}
                    </button>
                    <button class="modal-action-btn secondary" onclick="closeModal('depositModal')">
                        <i class="fa-regular fa-times"></i> Cancel
                    </button>
                </div>
            </div>
        `;
        
        const closeBtn = container.querySelector('.close-btn');
        // Remove old content after close button
        const oldContent = container.querySelectorAll('.input-group, #depositAddressContainer, .modal-actions');
        oldContent.forEach(el => el.remove());
        closeBtn.insertAdjacentHTML('beforebegin', selectHtml);
        
        document.getElementById('depositCurrencySelect').addEventListener('change', generateDepositAddress);
    }
    
    modal.classList.add('show');
    generateDepositAddress();
}

async function generateDepositAddress() {
    const currency = document.getElementById('depositCurrencySelect').value;
    const container = document.getElementById('depositAddressContainer');
    const addressEl = document.getElementById('depositAddress');
    
    container.style.display = 'block';
    addressEl.textContent = 'Generating address...';
    
    const result = await apiCall('/deposit/generate', 'POST', {
        userId: currentUserId,
        userName: currentUser.userName,
        currency: currency
    });
    
    if (result.success) {
        addressEl.textContent = result.address;
        document.getElementById('depositNetwork').innerHTML = `<i class="fa-regular fa-link"></i> Network: ${result.network}`;
        document.getElementById('depositMinAmount').innerHTML = `<i class="fa-regular fa-arrow-down"></i> Min: ${result.minDeposit} ${currency}`;
    } else {
        addressEl.textContent = 'Failed to generate address';
        showToast(result.error || 'Error generating address', 'error');
    }
}

function copyDepositAddress() {
    const addr = document.getElementById('depositAddress')?.textContent;
    if (addr && !addr.includes('Generating') && !addr.includes('Failed')) {
        navigator.clipboard.writeText(addr);
        showToast(t('deposit.copied'), 'success');
    }
}

async function submitDepositRequest() {
    const currency = document.getElementById('depositCurrencySelect').value;
    const address = document.getElementById('depositAddress').textContent;
    
    if (!address || address.includes('Generating') || address.includes('Failed')) {
        showToast('Please wait for address generation', 'error');
        return;
    }
    
    const result = await apiCall('/deposit/submit-request', 'POST', {
        userId: currentUserId,
        userName: currentUser.userName,
        currency: currency,
        amount: 0,
        address: address,
        txnId: null
    });
    
    if (result.success) {
        showToast(t('deposit.success'), 'success');
        closeModal('depositModal');
        
        addNotification({
            type: 'deposit',
            title: '📥 Deposit Request Submitted',
            message: `Your ${currency} deposit request is pending approval.`
        });
    } else {
        showToast(result.error || 'Failed to submit deposit', 'error');
    }
}

async function submitWithdraw() {
    const amount = parseFloat(document.getElementById('withdrawAmount')?.value);
    const address = document.getElementById('withdrawAddress')?.value.trim();
    
    if (!amount || amount < 10000) {
        showToast('Minimum withdrawal is 10,000 TROLL', 'error');
        return;
    }
    
    if (amount > (currentUser.balances.TROLL || 0)) {
        showToast('Insufficient balance', 'error');
        return;
    }
    
    if (!address || address.length < 32) {
        showToast('Enter a valid Solana wallet address', 'error');
        return;
    }
    
    showToast('Processing...', 'info');
    
    const res = await apiCall('/withdraw/request', 'POST', {
        userId: currentUserId,
        userName: currentUser.userName,
        currency: 'TROLL',
        amount: amount,
        address: address
    });
    
    if (res.success) {
        currentUser.balances.TROLL -= amount;
        if (!currentUser.transactions) currentUser.transactions = [];
        currentUser.transactions.unshift({
            type: 'withdraw',
            amount: amount,
            currency: 'TROLL',
            status: 'pending',
            timestamp: new Date().toISOString(),
            address: address
        });
        
        saveUserData();
        updateUI();
        
        showToast(t('withdraw.success'), 'success');
        closeModal('withdrawModal');
        
        addNotification({
            type: 'withdraw',
            title: '💸 Withdrawal Requested',
            message: `Your withdrawal of ${amount.toLocaleString()} TROLL is being processed.`
        });
    } else {
        showToast(res.error || 'Withdrawal failed', 'error');
    }
}

function showHistory() {
    showModal('historyModal');
    renderHistory('all');
}

function renderHistory(filter = 'all') {
    const container = document.getElementById('historyList');
    if (!container || !currentUser) return;
    
    let transactions = currentUser.transactions || [];
    if (filter !== 'all') transactions = transactions.filter(t => t.type === filter);
    
    if (transactions.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fa-regular fa-clock"></i><p>${t('history.empty')}</p></div>`;
        return;
    }
    
    let html = '';
    transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    transactions.forEach(tx => {
        const date = new Date(tx.timestamp);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        let icon = 'fa-circle-down';
        let typeClass = 'deposit';
        let typeText = 'Deposit';
        let amountClass = 'positive';
        let amountPrefix = '+';
        
        if (tx.type === 'withdraw') {
            icon = 'fa-circle-up'; typeClass = 'withdraw'; typeText = 'Withdrawal'; amountClass = 'negative'; amountPrefix = '-';
        } else if (tx.type === 'referral' || tx.type === 'referral_bonus') {
            icon = 'fa-users'; typeClass = 'referral'; typeText = 'Referral Bonus';
        } else if (tx.type === 'milestone') {
            icon = 'fa-trophy'; typeClass = 'referral'; typeText = 'Milestone';
        } else if (tx.type === 'admin_add') {
            icon = 'fa-crown'; typeClass = 'deposit'; typeText = 'Admin Credit';
        }
        
        let statusClass = 'completed';
        let statusText = 'Completed';
        if (tx.status === 'pending') { statusClass = 'pending'; statusText = 'Pending'; }
        else if (tx.status === 'rejected') { statusClass = 'rejected'; statusText = 'Rejected'; }
        
        html += `
            <div class="history-item">
                <div class="history-item-header">
                    <div class="history-type ${typeClass}">
                        <i class="fa-regular ${icon}"></i>
                        <span>${typeText}</span>
                    </div>
                    <span class="history-status-badge ${statusClass}">${statusText}</span>
                </div>
                <div class="history-details">
                    <span class="history-amount ${amountClass}">${amountPrefix}${tx.amount.toLocaleString()} ${tx.currency || 'TROLL'}</span>
                    <span class="history-date">${formattedDate}</span>
                </div>
                ${tx.address ? `<div class="history-address">${tx.address.slice(0, 8)}...${tx.address.slice(-8)}</div>` : ''}
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function filterHistory(filter) {
    document.querySelectorAll('.history-tab').forEach(t => t.classList.remove('active'));
    event?.target?.classList.add('active');
    renderHistory(filter);
}

function showNotifications() {
    showModal('notificationsModal');
    renderNotifications();
}

// ============================================================================
// SECTION 27: SETTINGS - SOLANA WALLET LINK (FIXED)
// ============================================================================

// This function is called from settings item onclick
function openSolanaWalletSettings() {
    console.log('🔐 Opening Solana Wallet from Settings');
    showSolanaWalletModal();
}

// ============================================================================
// SECTION 28: ADMIN AUTHENTICATION
// ============================================================================

function showAdminAuthModal() {
    let modal = document.getElementById('adminAuthModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'adminAuthModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="close-btn" onclick="closeModal('adminAuthModal')">&times;</button>
                <div class="modal-icon">👑</div>
                <h2>${t('admin.authenticate')}</h2>
                <p class="modal-desc">Enter the admin password to continue</p>
                
                <div class="input-group">
                    <label>${t('admin.password')}</label>
                    <input type="password" id="adminPasswordInput" placeholder="••••••••" autocomplete="off">
                </div>
                
                <div class="modal-actions">
                    <button class="modal-action-btn primary" onclick="verifyAdminPassword()">
                        <i class="fa-regular fa-check"></i> ${t('admin.verify')}
                    </button>
                    <button class="modal-action-btn secondary" onclick="closeModal('adminAuthModal')">
                        <i class="fa-regular fa-times"></i> ${t('admin.cancel')}
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        document.getElementById('adminPasswordInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') verifyAdminPassword();
        });
    }
    
    modal.classList.add('show');
    document.getElementById('adminPasswordInput').value = '';
    document.getElementById('adminPasswordInput').focus();
}

async function verifyAdminPassword() {
    const password = document.getElementById('adminPasswordInput').value;
    
    if (!password) {
        showToast('Please enter password', 'error');
        return;
    }
    
    const result = await apiCall('/admin/verify', 'POST', { password });
    
    if (result.success) {
        adminAuthenticated = true;
        adminAuthToken = password;
        saveAdminSession();
        closeModal('adminAuthModal');
        showAdminPanel();
        showToast('Authenticated successfully', 'success');
    } else {
        showToast('Invalid password', 'error');
    }
}

// ============================================================================
// SECTION 29: ADMIN PANEL
// ============================================================================

function showAdminPanel() {
    if (!adminAuthenticated) {
        if (loadAdminSession()) {
            console.log('✅ Admin session loaded from storage');
        } else {
            showAdminAuthModal();
            return;
        }
    }
    
    const panel = document.getElementById('adminPanel');
    if (panel) panel.classList.remove('hidden');
    
    loadAdminDashboard();
}

function closeAdminPanel() {
    const panel = document.getElementById('adminPanel');
    if (panel) panel.classList.add('hidden');
}

async function loadAdminDashboard() {
    const content = document.getElementById('adminContent');
    content.innerHTML = `<div class="loading-spinner"><i class="fa-regular fa-spinner fa-spin"></i> Loading...</div>`;
    
    try {
        const statsRes = await apiCall('/admin/stats', 'GET', null, true);
        if (statsRes.success) {
            adminStats = statsRes.stats;
        }
    } catch (e) {}
    
    renderAdminDashboard();
}

function renderAdminDashboard() {
    const content = document.getElementById('adminContent');
    
    let html = `
        <div class="admin-dashboard">
            <div class="admin-stats-grid">
                <div class="admin-stat-card" onclick="showAdminSection('deposits')">
                    <i class="fa-regular fa-circle-down"></i>
                    <div class="stat-value">${adminStats.pendingDeposits || 0}</div>
                    <div class="stat-label">${t('admin.pendingDeposits')}</div>
                </div>
                <div class="admin-stat-card" onclick="showAdminSection('withdrawals')">
                    <i class="fa-regular fa-circle-up"></i>
                    <div class="stat-value">${adminStats.pendingWithdrawals || 0}</div>
                    <div class="stat-label">${t('admin.pendingWithdrawals')}</div>
                </div>
                <div class="admin-stat-card" onclick="showAdminSection('users')">
                    <i class="fa-regular fa-users"></i>
                    <div class="stat-value">${adminStats.totalUsers || 0}</div>
                    <div class="stat-label">${t('admin.totalUsers')}</div>
                </div>
                <div class="admin-stat-card" onclick="showAdminSection('broadcast')">
                    <i class="fa-regular fa-bullhorn"></i>
                    <div class="stat-value">📢</div>
                    <div class="stat-label">${t('admin.broadcast')}</div>
                </div>
            </div>
            
            <div id="adminSectionContent" class="admin-section-content">
                <div class="admin-section-header">
                    <h3>${t('admin.pendingDeposits')}</h3>
                    <button class="refresh-btn" onclick="refreshAdminSection()">
                        <i class="fa-regular fa-rotate-right"></i>
                    </button>
                </div>
                <div id="adminListContainer" class="admin-list-container">
                    <div class="loading-spinner"><i class="fa-regular fa-spinner fa-spin"></i> Loading...</div>
                </div>
            </div>
        </div>
    `;
    
    content.innerHTML = html;
    loadPendingDeposits();
}

async function loadPendingDeposits() {
    const container = document.getElementById('adminListContainer');
    
    try {
        const res = await apiCall('/admin/pending-deposits', 'GET', null, true);
        
        if (res.success && res.deposits) {
            pendingDeposits = res.deposits;
            
            if (pendingDeposits.length === 0) {
                container.innerHTML = `<div class="empty-state"><i class="fa-regular fa-inbox"></i><p>No pending deposits</p></div>`;
                return;
            }
            
            let html = '';
            pendingDeposits.forEach(deposit => {
                html += `
                    <div class="admin-transaction-card">
                        <div class="admin-tx-header">
                            <div class="admin-tx-type deposit">
                                <i class="fa-regular fa-circle-down"></i>
                                <span>DEPOSIT</span>
                            </div>
                            <span class="admin-tx-status pending">PENDING</span>
                        </div>
                        <div class="admin-tx-details">
                            <div class="admin-tx-row">
                                <span class="admin-tx-label">User:</span>
                                <span class="admin-tx-value">${deposit.userName} (${deposit.userId})</span>
                            </div>
                            <div class="admin-tx-row">
                                <span class="admin-tx-label">Currency:</span>
                                <span class="admin-tx-value">${deposit.currency}</span>
                            </div>
                            <div class="admin-tx-row">
                                <span class="admin-tx-label">Address:</span>
                                <div class="admin-address-container">
                                    <code>${deposit.address?.slice(0, 16)}...</code>
                                    <button class="admin-copy-btn" onclick="copyToClipboard('${deposit.address}')">
                                        <i class="fa-regular fa-copy"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="admin-tx-row">
                                <span class="admin-tx-label">Time:</span>
                                <span class="admin-tx-value">${new Date(deposit.createdAt?.seconds * 1000).toLocaleString()}</span>
                            </div>
                        </div>
                        <div class="admin-tx-actions">
                            <input type="number" id="amount_${deposit.id}" placeholder="Amount" class="admin-amount-input" step="0.000001">
                            <button class="admin-approve-btn" onclick="approveDeposit('${deposit.id}', '${deposit.userId}', '${deposit.currency}')">
                                <i class="fa-regular fa-check"></i> ${t('admin.approve')}
                            </button>
                            <button class="admin-reject-btn" onclick="rejectDeposit('${deposit.id}')">
                                <i class="fa-regular fa-times"></i> ${t('admin.reject')}
                            </button>
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
        }
    } catch (e) {
        container.innerHTML = `<div class="empty-state"><p>Error loading deposits</p></div>`;
    }
}

async function loadPendingWithdrawals() {
    const container = document.getElementById('adminListContainer');
    
    try {
        const res = await apiCall('/admin/pending-withdrawals', 'GET', null, true);
        
        if (res.success && res.withdrawals) {
            pendingWithdrawals = res.withdrawals;
            
            if (pendingWithdrawals.length === 0) {
                container.innerHTML = `<div class="empty-state"><i class="fa-regular fa-inbox"></i><p>No pending withdrawals</p></div>`;
                return;
            }
            
            let html = '';
            pendingWithdrawals.forEach(w => {
                html += `
                    <div class="admin-transaction-card">
                        <div class="admin-tx-header">
                            <div class="admin-tx-type withdraw">
                                <i class="fa-regular fa-circle-up"></i>
                                <span>WITHDRAWAL</span>
                            </div>
                            <span class="admin-tx-status pending">PENDING</span>
                        </div>
                        <div class="admin-tx-details">
                            <div class="admin-tx-row">
                                <span class="admin-tx-label">User:</span>
                                <span class="admin-tx-value">${w.userName} (${w.userId})</span>
                            </div>
                            <div class="admin-tx-row">
                                <span class="admin-tx-label">Amount:</span>
                                <span class="admin-tx-value">${w.amount} ${w.currency}</span>
                            </div>
                            <div class="admin-tx-row">
                                <span class="admin-tx-label">Address:</span>
                                <div class="admin-address-container">
                                    <code>${w.address?.slice(0, 16)}...</code>
                                    <button class="admin-copy-btn" onclick="copyToClipboard('${w.address}')">
                                        <i class="fa-regular fa-copy"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="admin-tx-row">
                                <span class="admin-tx-label">Time:</span>
                                <span class="admin-tx-value">${new Date(w.createdAt?.seconds * 1000).toLocaleString()}</span>
                            </div>
                        </div>
                        <div class="admin-tx-actions">
                            <button class="admin-approve-btn" onclick="approveWithdrawal('${w.id}')">
                                <i class="fa-regular fa-check"></i> ${t('admin.approve')}
                            </button>
                            <button class="admin-reject-btn" onclick="rejectWithdrawal('${w.id}')">
                                <i class="fa-regular fa-times"></i> ${t('admin.reject')}
                            </button>
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
        }
    } catch (e) {
        container.innerHTML = `<div class="empty-state"><p>Error loading withdrawals</p></div>`;
    }
}

function showAdminSection(section) {
    const header = document.querySelector('.admin-section-header h3');
    
    if (section === 'deposits') {
        if (header) header.textContent = t('admin.pendingDeposits');
        loadPendingDeposits();
    } else if (section === 'withdrawals') {
        if (header) header.textContent = t('admin.pendingWithdrawals');
        loadPendingWithdrawals();
    } else if (section === 'users') {
        if (header) header.textContent = t('admin.users');
        showUserManagementInterface();
    } else if (section === 'broadcast') {
        if (header) header.textContent = t('admin.broadcast');
        showBroadcastInterface();
    }
}

function refreshAdminSection() {
    const header = document.querySelector('.admin-section-header h3');
    if (header?.textContent.includes('Deposit') || header?.textContent.includes('إيداع')) {
        loadPendingDeposits();
    } else if (header?.textContent.includes('Withdrawal') || header?.textContent.includes('سحب')) {
        loadPendingWithdrawals();
    }
}

async function approveDeposit(depositId, userId, currency) {
    const amountInput = document.getElementById(`amount_${depositId}`);
    const amount = parseFloat(amountInput?.value);
    
    if (!amount || amount <= 0) {
        showToast('Please enter a valid amount', 'error');
        return;
    }
    
    const addRes = await apiCall('/admin/add-balance', 'POST', {
        userId: userId,
        currency: currency,
        amount: amount
    }, true);
    
    if (addRes.success) {
        await apiCall('/admin/approve-deposit', 'POST', { depositId }, true);
        showToast('Deposit approved and balance added!', 'success');
        loadPendingDeposits();
        
        const statsRes = await apiCall('/admin/stats', 'GET', null, true);
        if (statsRes.success) adminStats = statsRes.stats;
    } else {
        showToast('Failed to add balance', 'error');
    }
}

async function rejectDeposit(depositId) {
    const reason = prompt(t('admin.reason') + ':');
    if (!reason) return;
    
    const res = await apiCall('/admin/reject-deposit', 'POST', { depositId, reason }, true);
    if (res.success) {
        showToast('Deposit rejected', 'success');
        loadPendingDeposits();
    } else {
        showToast('Failed to reject deposit', 'error');
    }
}

async function approveWithdrawal(withdrawalId) {
    const res = await apiCall('/admin/approve-withdrawal', 'POST', { withdrawalId }, true);
    if (res.success) {
        showToast('Withdrawal approved', 'success');
        loadPendingWithdrawals();
    } else {
        showToast('Failed to approve', 'error');
    }
}

async function rejectWithdrawal(withdrawalId) {
    const reason = prompt(t('admin.reason') + ':');
    if (!reason) return;
    
    const res = await apiCall('/admin/reject-withdrawal', 'POST', { withdrawalId, reason }, true);
    if (res.success) {
        showToast('Withdrawal rejected', 'success');
        loadPendingWithdrawals();
    } else {
        showToast('Failed to reject', 'error');
    }
}

function showUserManagementInterface() {
    const container = document.getElementById('adminListContainer');
    
    container.innerHTML = `
        <div class="admin-search-container">
            <input type="text" id="adminUserSearchInput" placeholder="${t('admin.search')}" class="admin-search-input">
            <button class="admin-action-btn" onclick="adminSearchUser()">
                <i class="fa-regular fa-search"></i> ${t('admin.searchBtn')}
            </button>
        </div>
        <div id="adminUserResult" class="admin-user-result"></div>
    `;
    
    document.getElementById('adminUserSearchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') adminSearchUser();
    });
}

async function adminSearchUser() {
    const input = document.getElementById('adminUserSearchInput');
    const term = input?.value.trim();
    const resultDiv = document.getElementById('adminUserResult');
    
    if (!term) { showToast('Enter User ID or Wallet Address', 'error'); return; }
    
    resultDiv.innerHTML = '<div class="loading-spinner"><i class="fa-regular fa-spinner fa-spin"></i> Searching...</div>';
    
    let userId = term;
    
    if (term.startsWith('0x') || term.startsWith('G') || term.startsWith('T')) {
        const res = await apiCall('/admin/search-by-wallet', 'POST', { walletAddress: term }, true);
        if (res.success && res.user) {
            userId = res.user.userId;
        } else {
            resultDiv.innerHTML = '<p style="color:var(--troll-red);text-align:center;">Wallet not found</p>';
            return;
        }
    }
    
    const res = await apiCall('/users/' + userId, 'GET');
    
    if (res.success && res.data) {
        const user = res.data;
        currentManageUserId = user.userId;
        
        let balancesHtml = '';
        if (user.balances) {
            balancesHtml = Object.entries(user.balances)
                .filter(([_, v]) => v > 0)
                .map(([c, v]) => `
                    <div class="admin-balance-item">
                        <div class="currency">${c}</div>
                        <div class="amount">${v.toLocaleString()}</div>
                    </div>
                `).join('');
        }
        
        resultDiv.innerHTML = `
            <div class="admin-user-card">
                <div class="admin-user-header">
                    <div class="admin-user-avatar">${user.avatar || '🧌'}</div>
                    <div class="admin-user-info">
                        <h4>${user.userName}</h4>
                        <p>ID: ${user.userId}</p>
                        <p>📊 Invites: ${user.inviteCount || 0} | 💰 Earned: ${(user.referralEarnings || 0).toLocaleString()} TROLL</p>
                        ${user.premium ? '<p style="color:#FFD700;">👑 Premium User</p>' : ''}
                        ${user.withdrawBlocked ? '<p style="color:var(--troll-red);">🚫 Withdrawals Blocked</p>' : ''}
                    </div>
                </div>
                
                <h4 style="margin:15px 0 10px;">💰 Balances</h4>
                <div class="admin-balance-grid">
                    ${balancesHtml || '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;">No balances</p>'}
                </div>
                
                <div class="admin-actions" style="margin-top:15px;">
                    <button class="admin-action-btn add" onclick="showAddBalanceModal()">
                        ➕ ${t('admin.addBalance')}
                    </button>
                    <button class="admin-action-btn remove" onclick="showRemoveBalanceModal()">
                        ➖ ${t('admin.removeBalance')}
                    </button>
                    ${!user.withdrawBlocked ? `
                    <button class="admin-action-btn block" onclick="blockUserWithdrawals()">
                        🔒 ${t('admin.blockUser')}
                    </button>` : ''}
                </div>
            </div>
        `;
    } else {
        resultDiv.innerHTML = '<p style="color:var(--troll-red);text-align:center;">User not found</p>';
    }
}

function showAddBalanceModal() {
    if (!currentManageUserId) { showToast('No user selected', 'error'); return; }
    
    const currency = prompt('Currency (TROLL, SOL, BNB, ETH, TRON):', 'TROLL');
    if (!currency) return;
    
    const amount = parseFloat(prompt(`Amount to ADD (${currency}):`, '0'));
    if (isNaN(amount) || amount <= 0) { showToast('Invalid amount', 'error'); return; }
    
    adminAddBalance(currentManageUserId, currency.toUpperCase(), amount);
}

function showRemoveBalanceModal() {
    if (!currentManageUserId) { showToast('No user selected', 'error'); return; }
    
    const currency = prompt('Currency (TROLL, SOL, BNB, ETH, TRON):', 'TROLL');
    if (!currency) return;
    
    const amount = parseFloat(prompt(`Amount to REMOVE (${currency}):`, '0'));
    if (isNaN(amount) || amount <= 0) { showToast('Invalid amount', 'error'); return; }
    
    adminRemoveBalance(currentManageUserId, currency.toUpperCase(), amount);
}

async function adminAddBalance(userId, currency, amount) {
    console.log('💰 Admin adding balance:', userId, currency, amount);
    
    const res = await apiCall('/admin/add-balance', 'POST', { userId, currency, amount }, true);
    
    if (res.success) {
        showToast(`Added ${amount} ${currency}!`, 'success');
        adminSearchUser();
    } else {
        showToast(res.error || 'Failed', 'error');
    }
}

async function adminRemoveBalance(userId, currency, amount) {
    console.log('💰 Admin removing balance:', userId, currency, amount);
    
    const res = await apiCall('/admin/remove-balance', 'POST', { userId, currency, amount }, true);
    
    if (res.success) {
        showToast(`Removed ${amount} ${currency}!`, 'success');
        adminSearchUser();
    } else {
        showToast(res.error || 'Failed', 'error');
    }
}

async function blockUserWithdrawals() {
    if (!currentManageUserId) return;
    
    if (!confirm('⚠️ PERMANENT ACTION: Block this user from withdrawals? This CANNOT be undone!')) return;
    
    const res = await apiCall('/admin/block-user', 'POST', { userId: currentManageUserId }, true);
    
    if (res.success) {
        showToast('User permanently blocked from withdrawals', 'success');
        adminSearchUser();
    } else {
        showToast('Failed to block user', 'error');
    }
}

function showBroadcastInterface() {
    const container = document.getElementById('adminListContainer');
    
    container.innerHTML = `
        <div class="broadcast-container">
            <div class="broadcast-target-selector">
                <button class="broadcast-target-btn active" onclick="selectBroadcastTarget('all')">${t('admin.targetAll')}</button>
                <button class="broadcast-target-btn" onclick="selectBroadcastTarget('bot')">${t('admin.targetBot')}</button>
                <button class="broadcast-target-btn" onclick="selectBroadcastTarget('app')">${t('admin.targetApp')}</button>
            </div>
            <textarea id="broadcastMessageInput" placeholder="${t('admin.broadcastMessage')}" rows="5"></textarea>
            <button class="admin-action-btn broadcast" onclick="sendBroadcast()">
                <i class="fa-regular fa-bullhorn"></i> ${t('admin.send')}
            </button>
            <div id="broadcastResult"></div>
        </div>
    `;
}

function selectBroadcastTarget(target) {
    selectedBroadcastTarget = target;
    document.querySelectorAll('.broadcast-target-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

async function sendBroadcast() {
    const message = document.getElementById('broadcastMessageInput')?.value.trim();
    if (!message) { showToast('Enter a message', 'error'); return; }
    
    const resultDiv = document.getElementById('broadcastResult');
    resultDiv.innerHTML = '<div class="loading-spinner"><i class="fa-regular fa-spinner fa-spin"></i> Sending...</div>';
    
    const res = await apiCall('/admin/broadcast', 'POST', {
        message: message,
        target: selectedBroadcastTarget
    }, true);
    
    if (res.success) {
        resultDiv.innerHTML = `<p style="color:var(--troll-green);">✅ Broadcast sent to ${res.notifiedCount} users!</p>`;
        document.getElementById('broadcastMessageInput').value = '';
        showToast('Broadcast sent!', 'success');
    } else {
        resultDiv.innerHTML = '<p style="color:var(--troll-red);">Failed to send broadcast</p>';
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    showToast(t('toast.copied'), 'success');
}

// ============================================================================
// SECTION 30: PREMIUM FUNCTIONS
// ============================================================================

function showPremiumModal() { 
    showModal('premiumModal'); 
}

async function buyPremium() {
    // ✅ التحقق الذكي: إذا كانت المحفظة غير موجودة فعلياً، نفتح نافذة الاتصال مباشرة
    if (!tonConnectUI?.wallet) {
        showToast('Please connect your TON wallet first', 'info');
        // ✅ إغلاق نافذة Premium قبل فتح نافذة الاتصال لتجنب النوافذ المخفية
        closeModal('premiumModal');
        await tonConnectUI.openModal();
        return;
    }
    
    showToast('Processing payment...', 'info');
    
    try {
        const tx = { 
            validUntil: Math.floor(Date.now() / 1000) + 300, 
            messages: [{ address: appConfig.ownerWallet, amount: '5000000000' }] 
        };
        const result = await tonConnectUI.sendTransaction(tx);
        
        if (result.boc) {
            await apiCall('/buy-premium', 'POST', { userId: currentUserId, txHash: result.boc });
            currentUser.premium = true;
            currentUser.withdrawalUnlocked = true;
            await saveUserData();
            updateUI();
            closeModal('premiumModal');
            showToast(t('premium.unlocked'), 'success');
            celebrateUnlock();
        }
    } catch (e) { 
        // رسالة أوضح للمستخدم عند فشل المعاملة
        showToast('Transaction failed. Please disconnect and reconnect your TON wallet, then try again.', 'error');
    }
}

// ============================================================================
// SECTION 31: TON CONNECT
// ============================================================================

async function initTONConnect() {
    if (typeof TON_CONNECT_UI === 'undefined') return;
    try {
        tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
            manifestUrl: location.origin + '/tonconnect-manifest.json',
            buttonRootId: 'tonConnectButton'
        });
        const restored = await tonConnectUI.connectionRestored;
        if (restored && tonConnectUI.wallet) {
            tonConnected = true;
            tonWalletAddress = tonConnectUI.wallet.account.address;
            updateSettingsUI();
        }
    } catch (e) { console.error('TON init error:', e); }
}

async function connectTONWallet() {
    // إذا كان متصلاً بالفعل، اقطع الاتصال أولاً
    if (tonConnected && tonConnectUI) {
        try {
            await tonConnectUI.disconnect();
        } catch(e) {
            console.log('Disconnect error:', e);
        }
        tonConnected = false;
        tonWalletAddress = null;
        if (currentUser) {
            currentUser.tonWallet = null;
            saveUserData();
        }
        updateSettingsUI();
        showToast('Wallet disconnected. Tap again to reconnect.', 'info');
        return;
    }
    
    // إذا كان غير متصل، افتح نافذة الاتصال
    if (!tonConnectUI) return;
    try {
        await tonConnectUI.openModal();
        const interval = setInterval(() => {
            if (tonConnectUI.wallet) {
                clearInterval(interval);
                tonConnected = true;
                tonWalletAddress = tonConnectUI.wallet.account.address;
                currentUser.tonWallet = tonWalletAddress;
                saveUserData();
                updateSettingsUI();
                showToast('TON Connected!', 'success');
            }
        }, 500);
        setTimeout(() => clearInterval(interval), 30000);
    } catch (e) { 
        showToast('Connection failed', 'error'); 
    }
}
// ============================================================================
// SECTION 32: NAVIGATION
// ============================================================================

function showWallet() {
    currentPage = 'wallet';
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById('walletSection')?.classList.remove('hidden');
    document.querySelectorAll('.nav-item-pro').forEach(n => n.classList.remove('active'));
    const walletBtn = document.querySelector('[data-tab="wallet"]');
    if (walletBtn) walletBtn.classList.add('active');
    renderAssets();
    renderTopCryptos();
    renderMemeCoins();
    updateTotalBalance();
    
    // ✅ إخفاء الزر العائم عند مغادرة صفحة Airdrop
    const floatingBtn = document.getElementById('floatingPremiumBtn');
    if (floatingBtn) floatingBtn.style.display = 'none';
}

function showAirdrop() {
    currentPage = 'airdrop';
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById('airdropSection')?.classList.remove('hidden');
    document.querySelectorAll('.nav-item-pro').forEach(n => n.classList.remove('active'));
    const airdropBtn = document.querySelector('[data-tab="airdrop"]');
    if (airdropBtn) airdropBtn.classList.add('active');
    
    // ✅ تحديث التقدم من القيم الحية قبل الرسم
    const m = currentUser.withdrawalMissions;
    if (m.mission2.revealed) {
        m.mission2.currentAmount = currentUser.referralEarnings || 0;
    }
    if (m.mission3.revealed) {
        m.mission3.currentNewReferrals = Math.max(0, 
            (currentUser.inviteCount || 0) - (m.mission3.referralsAtStart || 0)
        );
    }
    
    renderMissionsUI();
    renderMilestones();
    
    // ✅ إنشاء وإظهار الزر العائم لشراء Premium (يظهر فقط في صفحة Airdrop)
    let floatingBtn = document.getElementById('floatingPremiumBtn');
    if (!floatingBtn) {
        floatingBtn = document.createElement('div');
        floatingBtn.id = 'floatingPremiumBtn';
        floatingBtn.innerHTML = '⚡';
        floatingBtn.onclick = showPremiumModal;
        document.body.appendChild(floatingBtn);
    }
    floatingBtn.style.display = 'flex';
}

function showSettings() {
    currentPage = 'settings';
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById('settingsSection')?.classList.remove('hidden');
    document.querySelectorAll('.nav-item-pro').forEach(n => n.classList.remove('active'));
    const settingsBtn = document.querySelector('[data-tab="settings"]');
    if (settingsBtn) settingsBtn.classList.add('active');
    updateSettingsUI();
    
    // ✅ إخفاء الزر العائم عند مغادرة صفحة Airdrop
    const floatingBtn = document.getElementById('floatingPremiumBtn');
    if (floatingBtn) floatingBtn.style.display = 'none';
}

// ============================================================================
// SECTION 33: HELPERS
// ============================================================================

function showAssetDetails(symbol) {
    const balance = currentUser.balances[symbol] || 0;
    const price = cryptoPrices[symbol]?.price || 0;
    const value = balance * price;
    showToast(`${symbol}: ${balance.toLocaleString()} ($${value.toFixed(2)})`, 'info');
}

function showCryptoDetails(symbol) {
    const data = cryptoPrices[symbol] || { price: 0, change: 0 };
    const changeSymbol = data.change >= 0 ? '+' : '';
    showToast(`${symbol}: $${data.price.toFixed(6)} (${changeSymbol}${data.change.toFixed(1)}%)`, 'info');
}

function refreshPrices() {
    fetchLivePrices(true);
    showToast('Prices refreshed!', 'success');
}

function toggleLanguage() {
    currentLanguage = currentLanguage === 'en' ? 'ar' : 'en';
    localStorage.setItem('language', currentLanguage);
    document.body.classList.toggle('rtl', currentLanguage === 'ar');
    document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
    
    const langDisplay = document.getElementById('currentLangDisplay');
    if (langDisplay) langDisplay.textContent = currentLanguage === 'en' ? 'English' : 'العربية';
    
    updateUI();
    if (currentPage === 'airdrop') { renderMissionsUI(); renderMilestones(); }
    if (currentPage === 'settings') updateSettingsUI();
    
    showToast(currentLanguage === 'en' ? 'Language: English' : 'اللغة: العربية', 'success');
}

function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', currentTheme);
    document.documentElement.setAttribute('data-theme', currentTheme);
    showToast(`Theme: ${currentTheme}`, 'success');
}

function logout() {
    if (confirm(t('logout.confirm'))) {
        clearAdminSession();
        localStorage.clear();
        location.reload();
    }
}

function openSupport() {
    const username = appConfig?.supportUsername || 'Troll_Customer_Support';
    window.open(`https://t.me/${username}`, '_blank');
}

function showComingSoon(feature) {
    showToast(feature + ' coming soon!', 'info');
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toastMessage');
    if (!toast || !msgEl) return;
    
    msgEl.textContent = message;
    toast.classList.remove('hidden');
    
    const icon = toast.querySelector('i');
    if (icon) {
        if (type === 'error') icon.className = 'fa-solid fa-circle-exclamation';
        else if (type === 'info') icon.className = 'fa-solid fa-circle-info';
        else icon.className = 'fa-solid fa-circle-check';
    }
    
    setTimeout(() => toast.classList.add('hidden'), 5000);
}

// ============================================================================
// SECTION 34: COPY INVITE LINK & SHARE
// ============================================================================

function copyInviteLink() {
    const link = document.getElementById('inviteLink');
    if (link) {
        navigator.clipboard.writeText(link.value);
        showToast(t('toast.copied'), 'success');
    }
}

function shareInviteLink() {
    const link = getReferralLink();
    const text = encodeURIComponent('🧌 Join Troll Army! Get 1000 TROLL bonus!\n\n👉 ' + link);
    if (tg) tg.openTelegramLink('https://t.me/share/url?url=&text=' + text);
}

async function claimMilestone(referrals) {
    const milestone = MILESTONES.find(m => m.referrals === referrals);
    if (!milestone || milestone.isSpecial) return;
    if (!currentUser.claimedMilestones) currentUser.claimedMilestones = [];
    if (currentUser.claimedMilestones.includes(referrals)) return;
    if (currentUser.inviteCount < referrals) { showToast('Not enough referrals', 'error'); return; }
    
    currentUser.balances.TROLL += milestone.reward;
    currentUser.claimedMilestones.push(referrals);
    
    await saveUserData();
    await updateMissionsProgress();
    
    // ✅ FIXED: Update mission UI instantly after claiming milestone
    if (currentPage === 'airdrop') renderMissionsUI();
    
    updateUI();
    renderMilestones();
    
    addNotification({
        type: 'milestone',
        title: '🏆 Milestone Claimed!',
        message: `+${milestone.reward.toLocaleString()} TROLL claimed!`
    });
    
    showToast('🎉 Claimed ' + milestone.reward.toLocaleString() + ' TROLL!', 'success');
}

// ============================================================================
// SECTION 35: INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Troll Army - Professional Edition v28.0');
    console.log('✅ Notifications System: Fully Fixed (No Stacking)');
    console.log('✅ Admin Session: Persistence Enabled');
    console.log('✅ Solana Wallet: Fixed (Works from Missions & Settings)');
    console.log('✅ Withdrawal Modal: Professional Deposit-Style');
    console.log('✅ Transaction ID: Removed from Deposit');
    console.log('✅ Mission Progress: Fixed Instant UI Updates');
    
    document.documentElement.setAttribute('data-theme', currentTheme);
    if (currentLanguage === 'ar') {
        document.body.classList.add('rtl');
        document.documentElement.dir = 'rtl';
    }
    
    const langDisplay = document.getElementById('currentLangDisplay');
    if (langDisplay) langDisplay.textContent = currentLanguage === 'en' ? 'English' : 'العربية';
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) themeToggle.checked = currentTheme === 'dark';
    
    setTimeout(() => {
        const splash = document.getElementById('splashScreen');
        if (splash) splash.classList.add('hidden');
    }, 2000);
    
    await loadConfig();
    await initTONConnect();
    await initUser();
    await fetchLivePrices(true);
    
    setInterval(fetchLivePrices, 300000);
    setInterval(updateMissionsProgress, 30000);
    
    console.log('✅ Troll Army Professional Edition v28.0 - Ready!');
});

// ============================================================================
// SECTION 36: GLOBAL EXPORTS
// ============================================================================

window.showWallet = showWallet;
window.showAirdrop = showAirdrop;
window.showSettings = showSettings;
window.showDepositModal = showDepositModal;
window.showWithdrawModal = showWithdrawModal;
window.showPremiumModal = showPremiumModal;
window.showHistory = showHistory;
window.showNotifications = showNotifications;
window.showSolanaWalletModal = showSolanaWalletModal;
window.openSolanaWalletSettings = openSolanaWalletSettings;
window.submitSolanaWallet = submitSolanaWallet;
window.closeModal = closeModal;
window.copyInviteLink = copyInviteLink;
window.shareInviteLink = shareInviteLink;
window.copyDepositAddress = copyDepositAddress;
window.submitDepositRequest = submitDepositRequest;
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
window.filterHistory = filterHistory;
window.markNotificationRead = markNotificationRead;
window.clearReadNotifications = clearReadNotifications;
window.clearAllNotifications = clearAllNotifications;

// Admin exports
window.verifyAdminPassword = verifyAdminPassword;
window.showAdminPanel = showAdminPanel;
window.closeAdminPanel = closeAdminPanel;
window.showAdminSection = showAdminSection;
window.refreshAdminSection = refreshAdminSection;
window.approveDeposit = approveDeposit;
window.rejectDeposit = rejectDeposit;
window.approveWithdrawal = approveWithdrawal;
window.rejectWithdrawal = rejectWithdrawal;
window.adminSearchUser = adminSearchUser;
window.showAddBalanceModal = showAddBalanceModal;
window.showRemoveBalanceModal = showRemoveBalanceModal;
window.adminAddBalance = adminAddBalance;
window.adminRemoveBalance = adminRemoveBalance;
window.blockUserWithdrawals = blockUserWithdrawals;
window.selectBroadcastTarget = selectBroadcastTarget;
window.sendBroadcast = sendBroadcast;
window.copyToClipboard = copyToClipboard;

console.log('✅✅✅ TROLL ARMY - PROFESSIONAL EDITION v28.0 READY! ✅✅✅');
console.log('📢 Notifications: Fixed (No Stacking)');
console.log('🔐 Solana Wallet: Fixed (Missions + Settings)');
console.log('💸 Withdrawal Modal: Professional Deposit-Style');
console.log('🌐 Language: English Default, Arabic Full Support');
console.log('⚡ Mission Progress: Instant UI Updates After Referrals');
