// ============================================================================
// TROLL ARMY - PROFESSIONAL COMPLETE VERSION
// Version: 3.0.0 Final
// ============================================================================

// ============================================================================
// 1. TELEGRAM WEBAPP INITIALIZATION
// ============================================================================

const tg = window.Telegram?.WebApp;

// ============================================================================
// 2. GLOBAL STATE MANAGEMENT
// ============================================================================

const STATE = {
    user: null,
    userId: null,
    isGuest: true,
    currentPage: 'wallet',
    prices: {},
    language: localStorage.getItem('language') || 'en',
    theme: localStorage.getItem('theme') || 'dark',
    isAdmin: false,
    tonConnected: false,
    tonAddress: null,
    tonUI: null
};

// ============================================================================
// 3. APPLICATION CONFIGURATION
// ============================================================================

const CONFIG = {
    BOT_LINK: 'https://t.me/TROLLMiniappbot/instant',
    WELCOME_BONUS: 1000,
    REFERRAL_BONUS: 500,
    TROLL_PRICE_FALLBACK: 0.01915,
    ADMIN_ID: null,
    OWNER_WALLET: null
};

let appConfig = {};

// ============================================================================
// 4. COINGECKO CRYPTOCURRENCY DATA (15 COINS)
// ============================================================================

const CRYPTO_LIST = [
    { symbol: 'TROLL', name: 'Troll Token', coingeckoId: 'troll-2', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/36313.png' },
    { symbol: 'BTC', name: 'Bitcoin', coingeckoId: 'bitcoin', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png' },
    { symbol: 'ETH', name: 'Ethereum', coingeckoId: 'ethereum', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png' },
    { symbol: 'BNB', name: 'BNB', coingeckoId: 'binancecoin', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png' },
    { symbol: 'SOL', name: 'Solana', coingeckoId: 'solana', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png' },
    { symbol: 'DOGE', name: 'Dogecoin', coingeckoId: 'dogecoin', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/74.png' },
    { symbol: 'SHIB', name: 'Shiba Inu', coingeckoId: 'shiba-inu', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5994.png' },
    { symbol: 'PEPE', name: 'Pepe', coingeckoId: 'pepe', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/24478.png' },
    { symbol: 'BONK', name: 'Bonk', coingeckoId: 'bonk', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/23095.png' },
    { symbol: 'WIF', name: 'Dogwifhat', coingeckoId: 'dogwifcoin', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/28752.png' },
    { symbol: 'FLOKI', name: 'Floki', coingeckoId: 'floki', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/10804.png' },
    { symbol: 'POPCAT', name: 'Popcat', coingeckoId: 'popcat', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/28752.png' },
    { symbol: 'MEW', name: 'Cat in a Dogs World', coingeckoId: 'cat-in-a-dogs-world', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/29588.png' },
    { symbol: 'MYRO', name: 'Myro', coingeckoId: 'myro', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/28301.png' },
    { symbol: 'WEN', name: 'Wen', coingeckoId: 'wen-4', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/28932.png' }
];

const MY_ASSETS = ['TROLL', 'SOL', 'BNB', 'ETH', 'TRON'];
const MEME_COINS = ['DOGE', 'SHIB', 'PEPE', 'BONK', 'WIF', 'FLOKI', 'POPCAT', 'MEW', 'MYRO', 'WEN'];

// ============================================================================
// 5. MYSTERY MISSIONS CONFIGURATION
// ============================================================================

const MISSIONS = {
    mission1: { id: 'solana_wallet', title: 'Mission 1: Connect Solana', desc: 'Add your TROLL Solana wallet', hint: 'Go to Settings → Solana Wallet' },
    mission2: { id: 'referral_earnings', title: 'Mission 2: Build Wealth', desc: 'Earn 12,500 TROLL from referrals', required: 12500 },
    mission3: { id: 'new_referrals', title: 'Mission 3: Expand Army', desc: 'Get 12 NEW referrals', required: 12 },
    mission4: { id: 'holdings', title: 'Mission 4: Prove Holdings', desc: 'Hold 0.025 BNB or 0.25 SOL', requiredBNB: 0.025, requiredSOL: 0.25 }
};

// ============================================================================
// 6. REFERRAL MILESTONES
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
// 7. TRANSLATIONS
// ============================================================================

const LOCALES = {
    en: {
        'nav.wallet': 'Wallet',
        'nav.airdrop': 'Airdrop',
        'nav.settings': 'Settings',
        'wallet.totalBalance': 'Total Balance',
        'airdrop.totalInvites': 'Total Invites',
        'airdrop.earned': 'TROLL Earned',
        'airdrop.yourLink': 'Your Invite Link',
        'mission.revealLater': 'Reveals after previous mission',
        'mission.waitDays': 'Reveals in {days} days',
        'premium.unlocked': 'Premium Unlocked!',
        'withdrawal.unlocked': 'Withdrawal Unlocked!'
    },
    ar: {
        'nav.wallet': 'المحفظة',
        'nav.airdrop': 'الإيردروب',
        'nav.settings': 'الإعدادات',
        'wallet.totalBalance': 'الرصيد الإجمالي',
        'airdrop.totalInvites': 'إجمالي الدعوات',
        'airdrop.earned': 'TROLL المكتسبة',
        'airdrop.yourLink': 'رابط الدعوة',
        'mission.revealLater': 'ستكشف بعد المهمة السابقة',
        'mission.waitDays': 'ستكشف بعد {days} يوم',
        'premium.unlocked': 'تم تفعيل البريميوم!',
        'withdrawal.unlocked': 'تم فتح السحب!'
    }
};

function t(key, params = {}) {
    let text = LOCALES[STATE.language]?.[key] || LOCALES.en[key] || key;
    Object.keys(params).forEach(k => text = text.replace(`{${k}}`, params[k]));
    return text;
}

// ============================================================================
// 8. UTILITY FUNCTIONS
// ============================================================================

function log(message, data = null) {
    const prefix = '🧌 [Troll Army]';
    if (data) console.log(prefix, message, data);
    else console.log(prefix, message);
}

function formatNumber(num) {
    if (!num) return '0.00';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
}

function formatBalance(balance, symbol) {
    if (balance === undefined || balance === null) balance = 0;
    if (symbol === 'TROLL') return balance.toLocaleString() + ' TROLL';
    return balance.toLocaleString() + ' ' + symbol;
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toastMessage');
    if (!toast || !msgEl) return;
    msgEl.textContent = message;
    toast.classList.remove('hidden');
    const icon = toast.querySelector('i');
    if (icon) icon.className = type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('show');
}

function showModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('show');
}

function hideElement(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
}

function showElement(id, display = 'block') {
    const el = document.getElementById(id);
    if (el) el.style.display = display;
}

function copyToClipboard(text) {
    navigator.clipboard?.writeText(text);
    showToast('Copied!', 'success');
}

// ============================================================================
// 9. API COMMUNICATION
// ============================================================================

async function api(endpoint, method = 'GET', body = null) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    try {
        const response = await fetch(`/api${endpoint}`, options);
        return await response.json();
    } catch (error) {
        log('API Error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// 10. CONFIGURATION LOADER
// ============================================================================

async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        appConfig = await response.json();
        CONFIG.ADMIN_ID = appConfig.adminId;
        CONFIG.OWNER_WALLET = appConfig.ownerWallet;
        STATE.isAdmin = (STATE.userId === CONFIG.ADMIN_ID);
        return true;
    } catch (error) {
        log('Config error:', error);
        return false;
    }
}

// ============================================================================
// 11. COINGECKO LIVE PRICES
// ============================================================================

let lastPriceFetch = 0;

async function fetchLivePrices(force = false) {
    const now = Date.now();
    if (!force && lastPriceFetch && (now - lastPriceFetch) < 300000) return;
    
    log('Fetching CoinGecko prices...');
    
    try {
        const ids = CRYPTO_LIST.map(c => c.coingeckoId).join(',');
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
        const response = await fetch(url);
        const data = await response.json();
        
        CRYPTO_LIST.forEach(coin => {
            if (data[coin.coingeckoId]) {
                STATE.prices[coin.symbol] = {
                    price: data[coin.coingeckoId].usd,
                    change: data[coin.coingeckoId].usd_24h_change || 0
                };
            }
        });
        
        if (!STATE.prices['TROLL']) {
            STATE.prices['TROLL'] = { price: CONFIG.TROLL_PRICE_FALLBACK, change: 0 };
        }
        
        lastPriceFetch = now;
        
        if (STATE.currentPage === 'wallet') {
            renderAssets();
            renderTopCryptos();
            renderMemeCoins();
            updateTotalBalance();
        }
    } catch (error) {
        log('Price error:', error);
        STATE.prices['TROLL'] = { price: CONFIG.TROLL_PRICE_FALLBACK, change: 0 };
    }
}

// ============================================================================
// 12. TELEGRAM USER DETECTION
// ============================================================================

function getTelegramUser() {
    if (!tg) { log('No Telegram WebApp'); return null; }
    
    tg.ready();
    tg.expand();
    
    if (tg.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        log('User from initDataUnsafe:', user.id);
        return {
            id: user.id.toString(),
            name: user.first_name || 'Troll',
            username: user.username || '',
            initData: tg.initData || ''
        };
    }
    
    if (tg.initData) {
        try {
            const params = new URLSearchParams(tg.initData);
            const userJson = params.get('user');
            if (userJson) {
                const user = JSON.parse(decodeURIComponent(userJson));
                log('User from initData:', user.id);
                return {
                    id: user.id.toString(),
                    name: user.first_name || 'Troll',
                    username: user.username || '',
                    initData: tg.initData
                };
            }
        } catch (error) { log('Parse error:', error); }
    }
    
    return null;
}

function getReferralFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('startapp') || params.get('startapp') || params.get('ref') || null;
}

// ============================================================================
// 13. DEFAULT DATA CREATORS
// ============================================================================

function getDefaultMissions() {
    return {
        mission1: { completed: false, revealed: true, walletAddress: null },
        mission2: { completed: false, revealed: false, currentAmount: 0, requiredAmount: 12500 },
        mission3: { completed: false, revealed: false, referralsAtStart: 0, currentNewReferrals: 0, requiredReferrals: 12 },
        mission4: { completed: false, revealed: false, revealDate: null, requiredBNB: 0.025, requiredSOL: 0.25 }
    };
}

function createUserObject(userId, userName, userUsername, refCode) {
    return {
        userId, userName, userUsername: userUsername || '',
        balances: { TROLL: CONFIG.WELCOME_BONUS, BNB: 0, SOL: 0, ETH: 0, TRON: 0 },
        referralCode: userId,
        referredBy: refCode || null,
        referrals: [],
        inviteCount: 0,
        referralEarnings: 0,
        totalEarned: CONFIG.WELCOME_BONUS,
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
            message: `🎉 Welcome! +${CONFIG.WELCOME_BONUS} TROLL`,
            read: false,
            timestamp: new Date().toISOString()
        }],
        transactions: []
    };
}

function createGuestUser() {
    const guestId = 'guest_' + Date.now();
    STATE.user = {
        userId: guestId,
        userName: 'Guest',
        balances: { TROLL: 0, BNB: 0, SOL: 0, ETH: 0, TRON: 0 },
        inviteCount: 0,
        referralEarnings: 0,
        premium: false,
        avatar: '🧌',
        withdrawalUnlocked: false,
        claimedMilestones: [],
        settings: {},
        withdrawalMissions: getDefaultMissions(),
        notifications: [],
        transactions: []
    };
    STATE.userId = guestId;
    STATE.isGuest = true;
}

// ============================================================================
// 14. USER REGISTRATION & MANAGEMENT
// ============================================================================

async function registerUser(tgUser) {
    log('Registering:', tgUser.id);
    
    if (tgUser.initData) {
        try {
            const response = await api('/init-user', 'POST', { initData: tgUser.initData });
            if (response.success && response.userData) {
                log('Server authenticated');
                return response.userData;
            }
        } catch (error) { log('Server auth failed:', error); }
    }
    
    const refCode = getReferralFromUrl();
    const newUser = createUserObject(tgUser.id, tgUser.name, tgUser.username, refCode);
    
    try {
        await api('/users', 'POST', { userId: tgUser.id, userData: newUser });
        log('User saved to server');
    } catch (error) { log('Server save failed:', error); }
    
    return newUser;
}

async function saveUserData() {
    if (!STATE.user || STATE.isGuest) return;
    localStorage.setItem(`user_${STATE.userId}`, JSON.stringify(STATE.user));
    try { await api(`/users/${STATE.userId}`, 'PATCH', { updates: STATE.user }); } catch (error) {}
}

async function processReferral(refCode) {
    if (!refCode || refCode === STATE.userId || STATE.user.referredBy) return;
    log('Processing referral:', refCode);
    
    try {
        const response = await api('/referral', 'POST', { referrerId: refCode, newUserId: STATE.userId });
        if (response.success) {
            STATE.user.referredBy = refCode;
            STATE.user.balances.TROLL += CONFIG.REFERRAL_BONUS;
            STATE.user.referralEarnings += CONFIG.REFERRAL_BONUS;
            STATE.user.totalEarned += CONFIG.REFERRAL_BONUS;
            await saveUserData();
            showToast(`🎉 +${CONFIG.REFERRAL_BONUS} TROLL from referral!`, 'success');
        }
    } catch (error) { log('Referral error:', error); }
}

// ============================================================================
// 15. MAIN INITIALIZATION
// ============================================================================

async function initializeApp() {
    log('🚀 Initializing Troll Army...');
    
    const tgUser = getTelegramUser();
    
    if (tgUser) {
        STATE.isGuest = false;
        STATE.userId = tgUser.id;
        
        const saved = localStorage.getItem(`user_${STATE.userId}`);
        
        if (saved) {
            try { STATE.user = JSON.parse(saved); log('Loaded from storage'); }
            catch { STATE.user = await registerUser(tgUser); }
        } else {
            try {
                const response = await api(`/users/${STATE.userId}`);
                STATE.user = (response.success && response.data) ? response.data : await registerUser(tgUser);
            } catch { STATE.user = await registerUser(tgUser); }
        }
        
        localStorage.setItem(`user_${STATE.userId}`, JSON.stringify(STATE.user));
        
        const ref = getReferralFromUrl();
        if (ref) await processReferral(ref);
    } else {
        createGuestUser();
    }
    
    await loadConfig();
    
    window.TrollArmy = { userId: STATE.userId, userName: STATE.user?.userName || 'Guest', isGuest: STATE.isGuest };
    
    hideElement('splashScreen');
    showElement('mainApp');
    showElement('bottomNav', 'flex');
    
    renderUI();
    if (STATE.isAdmin) addAdminCrown();
    
    await fetchLivePrices(true);
    setInterval(() => fetchLivePrices(), 300000);
    
    log('✅ App ready!', { userId: STATE.userId, isGuest: STATE.isGuest, balance: STATE.user?.balances?.TROLL });
}

// ============================================================================
// 16. UI RENDERING
// ============================================================================

function renderUI() {
    if (!STATE.user) return;
    
    renderHeader();
    renderBalance();
    renderReferralStats();
    
    if (STATE.currentPage === 'wallet') {
        renderAssets();
        renderTopCryptos();
        renderMemeCoins();
    } else if (STATE.currentPage === 'airdrop') {
        renderMissionsUI();
        renderMilestones();
    } else if (STATE.currentPage === 'settings') {
        renderSettings();
    }
}

function renderHeader() {
    document.getElementById('userName').textContent = STATE.user.userName || 'Troll';
    document.getElementById('userIdDisplay').textContent = `ID: ${(STATE.userId || '').slice(-8)}`;
    const avatar = document.getElementById('userAvatar');
    if (avatar) avatar.textContent = STATE.user.premium ? '😏' : (STATE.user.avatar || '🧌');
}

function renderBalance() {
    document.getElementById('trollBalance').textContent = (STATE.user.balances?.TROLL || 0).toLocaleString();
    updateTotalBalance();
}

function updateTotalBalance() {
    let total = 0;
    MY_ASSETS.forEach(symbol => {
        const balance = STATE.user.balances?.[symbol] || 0;
        const price = STATE.prices[symbol]?.price || 0;
        total += balance * price;
    });
    
    document.getElementById('totalBalance').textContent = '$' + formatNumber(total);
    
    const trollBalance = STATE.user.balances?.TROLL || 0;
    const trollPrice = STATE.prices['TROLL']?.price || CONFIG.TROLL_PRICE_FALLBACK;
    document.getElementById('trollUsdValue').textContent = (trollBalance * trollPrice).toFixed(2);
}

function renderReferralStats() {
    document.getElementById('totalInvites').textContent = STATE.user.inviteCount || 0;
    document.getElementById('trollEarned').textContent = (STATE.user.referralEarnings || 0).toLocaleString();
    
    const link = STATE.isGuest ? CONFIG.BOT_LINK : `${CONFIG.BOT_LINK}?startapp=${STATE.userId}`;
    document.getElementById('inviteLink').value = link;
}

function renderAssets() {
    const container = document.getElementById('assetsList');
    if (!container) return;
    
    const assets = MY_ASSETS.map(symbol => {
        const coin = CRYPTO_LIST.find(c => c.symbol === symbol);
        return { symbol, name: coin?.name || symbol, icon: coin?.icon || '' };
    });
    
    let html = '';
    assets.forEach(asset => {
        const balance = STATE.user.balances?.[asset.symbol] || 0;
        const price = STATE.prices[asset.symbol]?.price || 0;
        const value = balance * price;
        
        html += `<div class="asset-item" onclick="showAssetDetails('${asset.symbol}')">
            <div class="asset-left"><img src="${asset.icon}" class="asset-icon-img"><div class="asset-info"><h4>${asset.name}</h4><p>${asset.symbol}</p></div></div>
            <div class="asset-right"><div class="asset-balance">${formatBalance(balance, asset.symbol)}</div><div class="asset-value">$${formatNumber(value)}</div></div>
        </div>`;
    });
    
    container.innerHTML = html;
}

function renderTopCryptos() {
    const container = document.getElementById('topCryptoList');
    if (!container) return;
    
    const topCoins = CRYPTO_LIST.filter(c => ['TROLL', 'BTC', 'ETH', 'BNB', 'SOL'].includes(c.symbol));
    
    let html = '';
    topCoins.forEach(coin => {
        const data = STATE.prices[coin.symbol] || { price: 0, change: 0 };
        const changeClass = data.change >= 0 ? 'positive' : 'negative';
        const changeSymbol = data.change >= 0 ? '+' : '';
        const decimals = coin.symbol === 'TROLL' ? 5 : 2;
        
        html += `<div class="crypto-item" onclick="showCryptoDetails('${coin.symbol}')">
            <div class="crypto-left"><img src="${coin.icon}" class="crypto-icon-img"><div class="crypto-info"><h4>${coin.name}</h4><p>${coin.symbol}</p></div></div>
            <div class="crypto-right"><div class="crypto-price">$${data.price.toFixed(decimals)}</div><div class="crypto-change ${changeClass}">${changeSymbol}${data.change.toFixed(1)}%</div></div>
        </div>`;
    });
    
    container.innerHTML = html;
}

function renderMemeCoins() {
    const container = document.getElementById('memeCoinList');
    if (!container) return;
    
    const memeCoins = CRYPTO_LIST.filter(c => MEME_COINS.includes(c.symbol));
    
    let html = '';
    memeCoins.forEach(coin => {
        const data = STATE.prices[coin.symbol] || { price: 0, change: 0 };
        const changeClass = data.change >= 0 ? 'positive' : 'negative';
        const changeSymbol = data.change >= 0 ? '+' : '';
        
        html += `<div class="crypto-item" onclick="showCryptoDetails('${coin.symbol}')">
            <div class="crypto-left"><img src="${coin.icon}" class="crypto-icon-img"><div class="crypto-info"><h4>${coin.name}</h4><p>${coin.symbol}</p></div></div>
            <div class="crypto-right"><div class="crypto-price">$${data.price.toFixed(8)}</div><div class="crypto-change ${changeClass}">${changeSymbol}${data.change.toFixed(1)}%</div></div>
        </div>`;
    });
    
    container.innerHTML = html;
}

function renderMissionsUI() {
    const container = document.getElementById('withdrawalLockCard');
    if (!container) return;
    
    if (STATE.user.premium) {
        container.innerHTML = `<div class="premium-unlocked-card"><div class="premium-icon-large">😏</div><h3>${t('premium.unlocked')}</h3><p>Instant withdrawal!</p></div>`;
        return;
    }
    
    const m = STATE.user.withdrawalMissions;
    
    let html = `<div class="lock-header"><i class="fas fa-${STATE.user.withdrawalUnlocked ? 'unlock' : 'lock'}"></i><span>${STATE.user.withdrawalUnlocked ? '✅ ' + t('withdrawal.unlocked') : '🔒 Withdrawal Locked'}</span></div><div class="missions-list-vertical">`;
    
    // Mission 1
    html += `<div class="mission-card ${m.mission1.completed ? 'completed' : ''}"><div class="mission-icon">${m.mission1.completed ? '✅' : '1️⃣'}</div><div class="mission-content"><h4>${MISSIONS.mission1.title}</h4><p>${STATE.user.settings?.solanaWallet ? 'Wallet: ' + STATE.user.settings.solanaWallet.slice(0, 8) + '...' : MISSIONS.mission1.desc}</p>${!m.mission1.completed ? '<button class="mission-action-btn" onclick="showSolanaWalletModal()">Add Wallet</button>' : ''}</div></div>`;
    
    // Mission 2
    if (m.mission2.revealed) {
        const progress = (m.mission2.currentAmount / 12500) * 100;
        html += `<div class="mission-card ${m.mission2.completed ? 'completed' : ''}"><div class="mission-icon">${m.mission2.completed ? '✅' : '2️⃣'}</div><div class="mission-content"><h4>${MISSIONS.mission2.title}</h4><p>${m.mission2.currentAmount.toLocaleString()} / 12,500 TROLL</p><div class="progress-bar small"><div class="progress-fill" style="width:${progress}%"></div></div></div></div>`;
    } else {
        html += `<div class="mission-card mystery"><div class="mission-icon">❓</div><div class="mission-content"><h4>Mission 2: ???</h4><p>${t('mission.revealLater')}</p></div></div>`;
    }
    
    // Mission 3
    if (m.mission3.revealed) {
        const progress = (m.mission3.currentNewReferrals / 12) * 100;
        html += `<div class="mission-card ${m.mission3.completed ? 'completed' : ''}"><div class="mission-icon">${m.mission3.completed ? '✅' : '3️⃣'}</div><div class="mission-content"><h4>${MISSIONS.mission3.title}</h4><p>${m.mission3.currentNewReferrals} / 12 new referrals</p><div class="progress-bar small"><div class="progress-fill" style="width:${progress}%"></div></div></div></div>`;
    } else {
        html += `<div class="mission-card mystery"><div class="mission-icon">❓</div><div class="mission-content"><h4>Mission 3: ???</h4><p>${t('mission.revealLater')}</p></div></div>`;
    }
    
    // Mission 4
    if (m.mission4.revealed) {
        const bnb = STATE.user.balances?.BNB || 0;
        const sol = STATE.user.balances?.SOL || 0;
        html += `<div class="mission-card ${m.mission4.completed ? 'completed' : ''}"><div class="mission-icon">${m.mission4.completed ? '✅' : '4️⃣'}</div><div class="mission-content"><h4>${MISSIONS.mission4.title}</h4><p>BNB: ${bnb.toFixed(4)}/0.025 | SOL: ${sol.toFixed(4)}/0.25</p></div></div>`;
    } else if (m.mission3.completed) {
        const daysLeft = Math.max(0, Math.ceil((new Date(m.mission4.revealDate) - new Date()) / 86400000));
        html += `<div class="mission-card mystery-timer"><div class="mission-icon">⏳</div><div class="mission-content"><h4>Final Mystery Mission</h4><p>${t('mission.waitDays', { days: daysLeft })}</p><div class="timer-progress-bar"><div class="timer-fill" style="width:${((20 - daysLeft) / 20) * 100}%"></div></div></div></div>`;
    } else {
        html += `<div class="mission-card mystery"><div class="mission-icon">❓</div><div class="mission-content"><h4>Mission 4: ???</h4><p>${t('mission.revealLater')}</p></div></div>`;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

function renderMilestones() {
    const container = document.getElementById('milestonesList');
    if (!container) return;
    
    let html = '';
    MILESTONES.forEach(milestone => {
        const progress = Math.min(((STATE.user.inviteCount || 0) / milestone.referrals) * 100, 100);
        const claimed = STATE.user.claimedMilestones?.includes(milestone.referrals);
        const canClaim = (STATE.user.inviteCount || 0) >= milestone.referrals && !claimed && !milestone.isSpecial;
        
        html += `<div class="milestone-item ${claimed ? 'claimed' : ''}">
            <div class="milestone-header"><span>${milestone.title}</span><span>${milestone.isSpecial ? '🎁' : milestone.reward.toLocaleString() + ' TROLL'}</span></div>
            <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
            <span class="progress-text">${STATE.user.inviteCount || 0}/${milestone.referrals}</span>
            ${canClaim ? `<button class="claim-btn" onclick="claimMilestone(${milestone.referrals})">Claim</button>` : ''}
            ${claimed ? '<p style="color:#2ecc71;">✓ Claimed</p>' : ''}
        </div>`;
    });
    
    container.innerHTML = html;
}

function renderSettings() {
    document.getElementById('settingsUserName').textContent = STATE.user?.userName || 'Troll';
    document.getElementById('settingsUserId').textContent = `ID: ${STATE.userId}`;
    
    const wallet = STATE.user?.settings?.solanaWallet;
    document.getElementById('currentSolanaWallet').textContent = wallet ? wallet.slice(0, 8) + '...' : 'Not set';
    
    const tonEl = document.getElementById('tonWalletStatus');
    if (tonEl) {
        tonEl.textContent = STATE.tonConnected && STATE.tonAddress ? STATE.tonAddress.slice(0, 6) + '...' + STATE.tonAddress.slice(-6) : 'Not connected';
        tonEl.style.color = STATE.tonConnected ? '#2ecc71' : '';
    }
}

function addAdminCrown() {
    const header = document.querySelector('.header-actions');
    if (!header || document.getElementById('adminCrownBtn')) return;
    
    const btn = document.createElement('button');
    btn.id = 'adminCrownBtn';
    btn.className = 'icon-btn';
    btn.innerHTML = '<i class="fas fa-crown" style="color: gold;"></i>';
    btn.onclick = () => showModal('adminPanel');
    header.insertBefore(btn, header.firstChild);
}

// ============================================================================
// 17. USER ACTIONS
// ============================================================================

function showSolanaWalletModal() {
    const address = prompt('Enter your Solana wallet address (TROLL token):');
    if (address && address.length > 30) {
        STATE.user.settings = STATE.user.settings || {};
        STATE.user.settings.solanaWallet = address;
        saveUserData();
        updateMissionsProgress();
        renderUI();
        showToast('✅ Wallet saved!', 'success');
    } else if (address) {
        showToast('Invalid address', 'error');
    }
}

async function updateMissionsProgress() {
    const m = STATE.user.withdrawalMissions;
    let changed = false;
    
    if (!m.mission1.completed && STATE.user.settings?.solanaWallet) { m.mission1.completed = true; m.mission2.revealed = true; changed = true; }
    if (m.mission2.revealed && !m.mission2.completed) { m.mission2.currentAmount = STATE.user.referralEarnings || 0; if (m.mission2.currentAmount >= m.mission2.requiredAmount) { m.mission2.completed = true; m.mission3.revealed = true; m.mission3.referralsAtStart = STATE.user.inviteCount || 0; changed = true; } }
    if (m.mission3.revealed && !m.mission3.completed) { m.mission3.currentNewReferrals = Math.max(0, (STATE.user.inviteCount || 0) - (m.mission3.referralsAtStart || 0)); if (m.mission3.currentNewReferrals >= m.mission3.requiredReferrals) { m.mission3.completed = true; const d = new Date(); d.setDate(d.getDate() + 20); m.mission4.revealDate = d.toISOString(); changed = true; } }
    if (m.mission3.completed && !m.mission4.revealed && new Date() >= new Date(m.mission4.revealDate)) { m.mission4.revealed = true; changed = true; }
    if (m.mission4.revealed && !m.mission4.completed) { const bnb = STATE.user.balances?.BNB || 0; const sol = STATE.user.balances?.SOL || 0; if (bnb >= m.mission4.requiredBNB || sol >= m.mission4.requiredSOL) { m.mission4.completed = true; changed = true; } }
    
    const allDone = m.mission1.completed && m.mission2.completed && m.mission3.completed && m.mission4.completed;
    if (allDone && !STATE.user.withdrawalUnlocked) { STATE.user.withdrawalUnlocked = true; changed = true; showToast('🎉 Withdrawal Unlocked!', 'success'); }
    
    if (changed) await saveUserData();
}

async function claimMilestone(referrals) {
    const milestone = MILESTONES.find(m => m.referrals === referrals);
    if (!milestone || milestone.isSpecial) return;
    if ((STATE.user.inviteCount || 0) < referrals) { showToast(`Need ${referrals} referrals`, 'error'); return; }
    if (STATE.user.claimedMilestones?.includes(referrals)) return;
    
    STATE.user.balances.TROLL += milestone.reward;
    STATE.user.totalEarned += milestone.reward;
    if (!STATE.user.claimedMilestones) STATE.user.claimedMilestones = [];
    STATE.user.claimedMilestones.push(referrals);
    
    await saveUserData();
    renderUI();
    showToast(`✅ Claimed ${milestone.reward.toLocaleString()} TROLL!`, 'success');
}

function copyInviteLink() {
    const link = document.getElementById('inviteLink');
    if (link) copyToClipboard(link.value);
}

function shareInviteLink() {
    const link = document.getElementById('inviteLink').value;
    const text = encodeURIComponent(`🧌 Join Troll Army! Get 1000 TROLL bonus!\n\n👉 ${link}`);
    tg?.openTelegramLink(`https://t.me/share/url?url=&text=${text}`);
}

// ============================================================================
// 18. COINPAYMENTS DEPOSIT & WITHDRAW
// ============================================================================

function showDepositModal() {
    showModal('depositModal');
    document.getElementById('depositAddress').textContent = '0xbf70420f57342c6Bd4267430D4D3b7E946f09450';
}

function copyDepositAddress() {
    const address = document.getElementById('depositAddress')?.textContent;
    if (address) copyToClipboard(address);
}

function submitDeposit() {
    showToast('Deposit submitted', 'success');
    closeModal('depositModal');
}

function showWithdrawModal() {
    if (!STATE.user.withdrawalUnlocked && !STATE.user.premium) {
        showToast('Complete missions first!', 'error');
        return;
    }
    showModal('withdrawModal');
}

function submitWithdraw() {
    showToast('Withdrawal requested', 'success');
    closeModal('withdrawModal');
}

// ============================================================================
// 19. TON CONNECT & PREMIUM
// ============================================================================

async function initTON() {
    if (typeof TON_CONNECT_UI === 'undefined') return;
    try {
        STATE.tonUI = new TON_CONNECT_UI.TonConnectUI({ manifestUrl: location.origin + '/tonconnect-manifest.json', buttonRootId: 'tonConnectButton' });
        const restored = await STATE.tonUI.connectionRestored;
        if (restored && STATE.tonUI.wallet) { STATE.tonConnected = true; STATE.tonAddress = STATE.tonUI.wallet.account.address; }
    } catch (error) { log('TON init error:', error); }
}

async function connectTON() {
    if (!STATE.tonUI) return;
    try {
        await STATE.tonUI.openModal();
        const interval = setInterval(() => {
            if (STATE.tonUI.wallet) {
                clearInterval(interval);
                STATE.tonConnected = true;
                STATE.tonAddress = STATE.tonUI.wallet.account.address;
                STATE.user.tonWallet = STATE.tonAddress;
                saveUserData();
                renderSettings();
                showToast('✅ TON Connected!', 'success');
            }
        }, 500);
        setTimeout(() => clearInterval(interval), 30000);
    } catch (error) { showToast('Connection failed', 'error'); }
}

function showPremiumModal() {
    showModal('premiumModal');
}

async function buyPremium() {
    if (!STATE.tonConnected) { showToast('Connect TON first', 'error'); return; }
    try {
        const transaction = { validUntil: Math.floor(Date.now() / 1000) + 300, messages: [{ address: CONFIG.OWNER_WALLET, amount: '5000000000' }] };
        const result = await STATE.tonUI.sendTransaction(transaction);
        if (result.boc) {
            STATE.user.premium = true;
            STATE.user.avatar = '😏';
            STATE.user.withdrawalUnlocked = true;
            await saveUserData();
            renderUI();
            closeModal('premiumModal');
            showToast('🎉 Premium Unlocked!', 'success');
        }
    } catch (error) { showToast('Payment failed', 'error'); }
}

// ============================================================================
// 20. NAVIGATION
// ============================================================================

function showWallet() {
    STATE.currentPage = 'wallet';
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    showElement('walletSection');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector('[data-tab="wallet"]').classList.add('active');
    renderUI();
}

function showAirdrop() {
    STATE.currentPage = 'airdrop';
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    showElement('airdropSection');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector('[data-tab="airdrop"]').classList.add('active');
    renderUI();
}

function showSettings() {
    STATE.currentPage = 'settings';
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    showElement('settingsSection');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector('[data-tab="settings"]').classList.add('active');
    renderSettings();
}

// ============================================================================
// 21. HELPERS
// ============================================================================

function showAssetDetails(symbol) {
    const balance = STATE.user.balances?.[symbol] || 0;
    showToast(`${symbol}: ${formatBalance(balance, symbol)}`, 'info');
}

function showCryptoDetails(symbol) {
    const data = STATE.prices[symbol] || { price: 0, change: 0 };
    const changeSymbol = data.change >= 0 ? '+' : '';
    showToast(`${symbol}: $${data.price.toFixed(6)} (${changeSymbol}${data.change.toFixed(1)}%)`, 'info');
}

function refreshPrices() {
    fetchLivePrices(true);
    showToast('Prices refreshed!', 'success');
}

function toggleLanguage() {
    STATE.language = STATE.language === 'en' ? 'ar' : 'en';
    localStorage.setItem('language', STATE.language);
    location.reload();
}

function toggleTheme() {
    STATE.theme = STATE.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', STATE.theme);
    document.documentElement.setAttribute('data-theme', STATE.theme);
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.clear();
        location.reload();
    }
}

function openSupport() {
    window.open('https://t.me/TrollSupport', '_blank');
}

function showHistory() {
    showModal('historyModal');
}

function showNotifications() {
    showModal('notificationsModal');
}

function closeAdminPanel() {
    closeModal('adminPanel');
}

// ============================================================================
// 22. START APPLICATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    document.documentElement.setAttribute('data-theme', STATE.theme);
    if (STATE.language === 'ar') { document.body.classList.add('rtl'); document.documentElement.dir = 'rtl'; }
    setTimeout(() => { initializeApp(); }, 500);
    await initTON();
});

// ============================================================================
// 23. GLOBAL EXPORTS
// ============================================================================

window.showWallet = showWallet;
window.showAirdrop = showAirdrop;
window.showSettings = showSettings;
window.showDepositModal = showDepositModal;
window.showWithdrawModal = showWithdrawModal;
window.showPremiumModal = showPremiumModal;
window.showHistory = showHistory;
window.showNotifications = showNotifications;
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
window.connectTONWallet = connectTON;
window.showAssetDetails = showAssetDetails;
window.showCryptoDetails = showCryptoDetails;
window.showSolanaWalletModal = showSolanaWalletModal;

console.log('✅✅✅ TROLL ARMY - COMPLETE PROFESSIONAL VERSION LOADED! ✅✅✅');
