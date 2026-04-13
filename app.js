// ============================================================================
// TROLL ARMY - PROFESSIONAL MINI APP
// Version: 5.0.0 Final
// Architecture: Clean, Separated Functions, Production Ready
// ============================================================================

// ============================================================================
// SECTION 1: TELEGRAM WEBAPP INITIALIZATION
// ============================================================================

const tg = window.Telegram?.WebApp;

// ============================================================================
// SECTION 2: GLOBAL STATE
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
// SECTION 3: CONFIGURATION
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
// SECTION 4: CRYPTOCURRENCY DATA
// ============================================================================

const CRYPTO_LIST = [
    {
        symbol: 'TROLL',
        name: 'Troll Token',
        coingeckoId: 'troll-2',
        icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/36313.png'
    },
    {
        symbol: 'BTC',
        name: 'Bitcoin',
        coingeckoId: 'bitcoin',
        icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png'
    },
    {
        symbol: 'ETH',
        name: 'Ethereum',
        coingeckoId: 'ethereum',
        icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png'
    },
    {
        symbol: 'BNB',
        name: 'BNB',
        coingeckoId: 'binancecoin',
        icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png'
    },
    {
        symbol: 'SOL',
        name: 'Solana',
        coingeckoId: 'solana',
        icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png'
    },
    {
        symbol: 'DOGE',
        name: 'Dogecoin',
        coingeckoId: 'dogecoin',
        icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/74.png'
    },
    {
        symbol: 'SHIB',
        name: 'Shiba Inu',
        coingeckoId: 'shiba-inu',
        icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5994.png'
    },
    {
        symbol: 'PEPE',
        name: 'Pepe',
        coingeckoId: 'pepe',
        icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/24478.png'
    },
    {
        symbol: 'BONK',
        name: 'Bonk',
        coingeckoId: 'bonk',
        icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/23095.png'
    },
    {
        symbol: 'WIF',
        name: 'Dogwifhat',
        coingeckoId: 'dogwifcoin',
        icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/28752.png'
    }
];

const MY_ASSETS = ['TROLL', 'SOL', 'BNB', 'ETH', 'TRON'];

const MEME_COINS = ['DOGE', 'SHIB', 'PEPE', 'BONK', 'WIF'];

// ============================================================================
// SECTION 5: MYSTERY MISSIONS CONFIGURATION
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
        required: 12500
    },
    mission3: {
        id: 'new_referrals',
        title: 'Mission 3: Expand Army',
        desc: 'Get 12 NEW referrals',
        required: 12
    },
    mission4: {
        id: 'holdings',
        title: 'Mission 4: Prove Holdings',
        desc: 'Hold 0.025 BNB or 0.25 SOL',
        requiredBNB: 0.025,
        requiredSOL: 0.25
    }
};

// ============================================================================
// SECTION 6: REFERRAL MILESTONES
// ============================================================================

const MILESTONES = [
    {
        referrals: 10,
        reward: 5000,
        title: '🤡 Baby Troll'
    },
    {
        referrals: 25,
        reward: 12500,
        title: '😈 Master Troll'
    },
    {
        referrals: 100,
        reward: 25000,
        title: '👹 Troll Lord'
    },
    {
        referrals: 250,
        reward: 50000,
        title: '🧌 Troll King'
    },
    {
        referrals: 500,
        reward: 100000,
        title: '🔥 Troll God'
    },
    {
        referrals: 1000,
        reward: 0,
        title: '💀 Grand Master',
        isSpecial: true
    }
];

// ============================================================================
// SECTION 7: TRANSLATIONS
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

// ============================================================================
// SECTION 8: UTILITY FUNCTIONS
// ============================================================================

function t(key, params = {}) {
    let text = LOCALES[STATE.language]?.[key] || LOCALES.en[key] || key;
    
    Object.keys(params).forEach(function(k) {
        text = text.replace(`{${k}}`, params[k]);
    });
    
    return text;
}

function log(message, data) {
    const prefix = '🧌 [Troll Army]';
    
    if (data !== undefined) {
        console.log(prefix, message, data);
    } else {
        console.log(prefix, message);
    }
}

function formatNumber(num) {
    if (!num) {
        return '0.00';
    }
    
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(2) + 'B';
    }
    
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
    }
    
    if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K';
    }
    
    return num.toFixed(2);
}

function formatBalance(balance, symbol) {
    if (balance === undefined || balance === null) {
        balance = 0;
    }
    
    if (symbol === 'TROLL') {
        return balance.toLocaleString() + ' TROLL';
    }
    
    return balance.toLocaleString() + ' ' + symbol;
}

function showToast(message, type) {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toastMessage');
    
    if (!toast || !msgEl) {
        return;
    }
    
    msgEl.textContent = message;
    toast.classList.remove('hidden');
    
    const icon = toast.querySelector('i');
    
    if (type === 'error') {
        icon.className = 'fas fa-exclamation-circle';
    } else {
        icon.className = 'fas fa-check-circle';
    }
    
    setTimeout(function() {
        toast.classList.add('hidden');
    }, 3000);
}

function closeModal(id) {
    const modal = document.getElementById(id);
    
    if (modal) {
        modal.classList.remove('show');
    }
}

function showModal(id) {
    const modal = document.getElementById(id);
    
    if (modal) {
        modal.classList.add('show');
    }
}

function hideElement(id) {
    const el = document.getElementById(id);
    
    if (el) {
        el.style.display = 'none';
    }
}

function showElement(id, display) {
    const el = document.getElementById(id);
    const displayValue = display || 'block';
    
    if (el) {
        el.style.display = displayValue;
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
    }
    
    showToast('Copied!', 'success');
}

// ============================================================================
// SECTION 9: API COMMUNICATION
// ============================================================================

async function api(endpoint, method, body) {
    const options = {
        method: method || 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch('/api' + endpoint, options);
        const data = await response.json();
        return data;
    } catch (error) {
        log('API Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ============================================================================
// SECTION 10: CONFIGURATION LOADER
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
// SECTION 11: COINGECKO LIVE PRICES
// ============================================================================

let lastPriceFetch = 0;

async function fetchLivePrices(force) {
    const now = Date.now();
    
    if (!force && lastPriceFetch && (now - lastPriceFetch) < 300000) {
        return;
    }
    
    log('Fetching CoinGecko prices...');
    
    try {
        const ids = CRYPTO_LIST.map(function(c) {
            return c.coingeckoId;
        }).join(',');
        
        const url = 'https://api.coingecko.com/api/v3/simple/price?ids=' + ids + '&vs_currencies=usd&include_24hr_change=true';
        const response = await fetch(url);
        const data = await response.json();
        
        CRYPTO_LIST.forEach(function(coin) {
            if (data[coin.coingeckoId]) {
                STATE.prices[coin.symbol] = {
                    price: data[coin.coingeckoId].usd,
                    change: data[coin.coingeckoId].usd_24h_change || 0
                };
            }
        });
        
        if (!STATE.prices['TROLL']) {
            STATE.prices['TROLL'] = {
                price: CONFIG.TROLL_PRICE_FALLBACK,
                change: 0
            };
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
        STATE.prices['TROLL'] = {
            price: CONFIG.TROLL_PRICE_FALLBACK,
            change: 0
        };
    }
}

// ============================================================================
// SECTION 12: TELEGRAM USER DETECTION
// ============================================================================

function getTelegramUser() {
    if (!tg) {
        log('No Telegram WebApp');
        return null;
    }
    
    tg.ready();
    tg.expand();
    
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
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
        } catch (error) {
            log('Parse error:', error);
        }
    }
    
    return null;
}

function getReferralFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('startapp') || params.get('startapp') || params.get('ref') || null;
}

// ============================================================================
// SECTION 13: DEFAULT DATA CREATORS
// ============================================================================

function getDefaultMissions() {
    return {
        mission1: {
            completed: false,
            revealed: true,
            walletAddress: null
        },
        mission2: {
            completed: false,
            revealed: false,
            currentAmount: 0,
            requiredAmount: 12500
        },
        mission3: {
            completed: false,
            revealed: false,
            referralsAtStart: 0,
            currentNewReferrals: 0,
            requiredReferrals: 12
        },
        mission4: {
            completed: false,
            revealed: false,
            revealDate: null,
            requiredBNB: 0.025,
            requiredSOL: 0.25
        }
    };
}

function createUserObject(userId, userName, userUsername, refCode) {
    return {
        userId: userId,
        userName: userName,
        userUsername: userUsername || '',
        balances: {
            TROLL: CONFIG.WELCOME_BONUS,
            BNB: 0,
            SOL: 0,
            ETH: 0,
            TRON: 0
        },
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
        settings: {
            solanaWallet: null
        },
        withdrawalMissions: getDefaultMissions(),
        notifications: [],
        transactions: []
    };
}

function createGuestUser() {
    const guestId = 'guest_' + Date.now();
    
    STATE.user = {
        userId: guestId,
        userName: 'Guest',
        balances: {
            TROLL: 0,
            BNB: 0,
            SOL: 0,
            ETH: 0,
            TRON: 0
        },
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
// SECTION 14: USER REGISTRATION
// ============================================================================

async function registerUser(tgUser) {
    log('Registering:', tgUser.id);
    
    if (tgUser.initData) {
        try {
            const response = await api('/init-user', 'POST', {
                initData: tgUser.initData
            });
            
            if (response.success && response.userData) {
                log('Server authenticated');
                return response.userData;
            }
        } catch (error) {
            log('Server auth failed:', error);
        }
    }
    
    const refCode = getReferralFromUrl();
    const newUser = createUserObject(tgUser.id, tgUser.name, tgUser.username, refCode);
    
    try {
        await api('/users', 'POST', {
            userId: tgUser.id,
            userData: newUser
        });
        log('User saved to server');
    } catch (error) {
        log('Server save failed:', error);
    }
    
    return newUser;
}

async function saveUserData() {
    if (!STATE.user || STATE.isGuest) {
        return;
    }
    
    const key = 'user_' + STATE.userId;
    localStorage.setItem(key, JSON.stringify(STATE.user));
    
    try {
        await api('/users/' + STATE.userId, 'PATCH', {
            updates: STATE.user
        });
    } catch (error) {
        log('Save error:', error);
    }
}

async function processReferral(refCode) {
    if (!refCode) {
        return;
    }
    
    if (refCode === STATE.userId) {
        return;
    }
    
    if (STATE.user.referredBy) {
        return;
    }
    
    log('Processing referral:', refCode);
    
    try {
        const response = await api('/referral', 'POST', {
            referrerId: refCode,
            newUserId: STATE.userId
        });
        
        if (response.success) {
            STATE.user.referredBy = refCode;
            STATE.user.balances.TROLL += CONFIG.REFERRAL_BONUS;
            STATE.user.referralEarnings += CONFIG.REFERRAL_BONUS;
            STATE.user.totalEarned += CONFIG.REFERRAL_BONUS;
            
            await saveUserData();
            showToast('🎉 +' + CONFIG.REFERRAL_BONUS + ' TROLL from referral!', 'success');
        }
    } catch (error) {
        log('Referral error:', error);
    }
}

// ============================================================================
// SECTION 15: MAIN INITIALIZATION
// ============================================================================

async function initializeApp() {
    log('🚀 Initializing Troll Army...');
    
    const tgUser = getTelegramUser();
    
    if (tgUser) {
        STATE.isGuest = false;
        STATE.userId = tgUser.id;
        
        const savedKey = 'user_' + STATE.userId;
        const saved = localStorage.getItem(savedKey);
        
        if (saved) {
            try {
                STATE.user = JSON.parse(saved);
                log('Loaded from storage');
            } catch (error) {
                STATE.user = await registerUser(tgUser);
            }
        } else {
            try {
                const response = await api('/users/' + STATE.userId);
                
                if (response.success && response.data) {
                    STATE.user = response.data;
                    log('Loaded from server');
                } else {
                    STATE.user = await registerUser(tgUser);
                }
            } catch (error) {
                STATE.user = await registerUser(tgUser);
            }
        }
        
        localStorage.setItem(savedKey, JSON.stringify(STATE.user));
        
        const ref = getReferralFromUrl();
        
        if (ref) {
            await processReferral(ref);
        }
    } else {
        createGuestUser();
    }
    
    await loadConfig();
    
    window.TrollArmy = {
        userId: STATE.userId,
        userName: STATE.user ? STATE.user.userName : 'Guest',
        isGuest: STATE.isGuest
    };
    
    hideElement('splashScreen');
    showElement('mainApp');
    showElement('bottomNav', 'flex');
    
    renderUI();
    
    if (STATE.isAdmin) {
        addAdminCrown();
    }
    
    await fetchLivePrices(true);
    setInterval(function() {
        fetchLivePrices();
    }, 300000);
    
    log('✅ App ready!', {
        userId: STATE.userId,
        isGuest: STATE.isGuest,
        balance: STATE.user ? STATE.user.balances.TROLL : 0
    });
}

// ============================================================================
// SECTION 16: UI RENDERING
// ============================================================================

function renderUI() {
    if (!STATE.user) {
        return;
    }
    
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
    document.getElementById('userIdDisplay').textContent = 'ID: ' + (STATE.userId || '').slice(-8);
    
    const avatar = document.getElementById('userAvatar');
    
    if (avatar) {
        if (STATE.user.premium) {
            avatar.textContent = '😏';
        } else {
            avatar.textContent = STATE.user.avatar || '🧌';
        }
    }
}

function renderBalance() {
    const trollBalance = STATE.user.balances.TROLL || 0;
    document.getElementById('trollBalance').textContent = trollBalance.toLocaleString();
    
    updateTotalBalance();
}

function updateTotalBalance() {
    let total = 0;
    
    MY_ASSETS.forEach(function(symbol) {
        const balance = STATE.user.balances[symbol] || 0;
        const price = STATE.prices[symbol] ? STATE.prices[symbol].price : 0;
        total += balance * price;
    });
    
    document.getElementById('totalBalance').textContent = '$' + formatNumber(total);
    
    const trollBalance = STATE.user.balances.TROLL || 0;
    const trollPrice = STATE.prices['TROLL'] ? STATE.prices['TROLL'].price : CONFIG.TROLL_PRICE_FALLBACK;
    document.getElementById('trollUsdValue').textContent = (trollBalance * trollPrice).toFixed(2);
}

function renderReferralStats() {
    document.getElementById('totalInvites').textContent = STATE.user.inviteCount || 0;
    document.getElementById('trollEarned').textContent = (STATE.user.referralEarnings || 0).toLocaleString();
    
    let link = CONFIG.BOT_LINK;
    
    if (!STATE.isGuest) {
        link = CONFIG.BOT_LINK + '?startapp=' + STATE.userId;
    }
    
    document.getElementById('inviteLink').value = link;
}

function renderAssets() {
    const container = document.getElementById('assetsList');
    
    if (!container) {
        return;
    }
    
    let html = '';
    
    MY_ASSETS.forEach(function(symbol) {
        const coin = CRYPTO_LIST.find(function(c) {
            return c.symbol === symbol;
        });
        
        const balance = STATE.user.balances[symbol] || 0;
        const price = STATE.prices[symbol] ? STATE.prices[symbol].price : 0;
        const value = balance * price;
        
        html += '<div class="asset-item" onclick="showAssetDetails(\'' + symbol + '\')">';
        html += '<div class="asset-left">';
        html += '<img src="' + (coin ? coin.icon : '') + '" class="asset-icon-img" alt="' + symbol + '">';
        html += '<div class="asset-info">';
        html += '<h4>' + (coin ? coin.name : symbol) + '</h4>';
        html += '<p>' + symbol + '</p>';
        html += '</div>';
        html += '</div>';
        html += '<div class="asset-right">';
        html += '<div class="asset-balance">' + formatBalance(balance, symbol) + '</div>';
        html += '<div class="asset-value">$' + formatNumber(value) + '</div>';
        html += '</div>';
        html += '</div>';
    });
    
    container.innerHTML = html;
}

function renderTopCryptos() {
    const container = document.getElementById('topCryptoList');
    
    if (!container) {
        return;
    }
    
    const topCoins = CRYPTO_LIST.filter(function(c) {
        return c.symbol === 'TROLL' || c.symbol === 'BTC' || c.symbol === 'ETH' || c.symbol === 'BNB' || c.symbol === 'SOL';
    });
    
    let html = '';
    
    topCoins.forEach(function(coin) {
        const data = STATE.prices[coin.symbol] || { price: 0, change: 0 };
        const changeClass = data.change >= 0 ? 'positive' : 'negative';
        const changeSymbol = data.change >= 0 ? '+' : '';
        const decimals = coin.symbol === 'TROLL' ? 5 : 2;
        
        html += '<div class="crypto-item" onclick="showCryptoDetails(\'' + coin.symbol + '\')">';
        html += '<div class="crypto-left">';
        html += '<img src="' + coin.icon + '" class="crypto-icon-img" alt="' + coin.symbol + '">';
        html += '<div class="crypto-info">';
        html += '<h4>' + coin.name + '</h4>';
        html += '<p>' + coin.symbol + '</p>';
        html += '</div>';
        html += '</div>';
        html += '<div class="crypto-right">';
        html += '<div class="crypto-price">$' + data.price.toFixed(decimals) + '</div>';
        html += '<div class="crypto-change ' + changeClass + '">' + changeSymbol + data.change.toFixed(1) + '%</div>';
        html += '</div>';
        html += '</div>';
    });
    
    container.innerHTML = html;
}

function renderMemeCoins() {
    const container = document.getElementById('memeCoinList');
    
    if (!container) {
        return;
    }
    
    const memeCoins = CRYPTO_LIST.filter(function(c) {
        return MEME_COINS.includes(c.symbol);
    });
    
    let html = '';
    
    memeCoins.forEach(function(coin) {
        const data = STATE.prices[coin.symbol] || { price: 0, change: 0 };
        const changeClass = data.change >= 0 ? 'positive' : 'negative';
        const changeSymbol = data.change >= 0 ? '+' : '';
        
        html += '<div class="crypto-item" onclick="showCryptoDetails(\'' + coin.symbol + '\')">';
        html += '<div class="crypto-left">';
        html += '<img src="' + coin.icon + '" class="crypto-icon-img" alt="' + coin.symbol + '">';
        html += '<div class="crypto-info">';
        html += '<h4>' + coin.name + '</h4>';
        html += '<p>' + coin.symbol + '</p>';
        html += '</div>';
        html += '</div>';
        html += '<div class="crypto-right">';
        html += '<div class="crypto-price">$' + data.price.toFixed(8) + '</div>';
        html += '<div class="crypto-change ' + changeClass + '">' + changeSymbol + data.change.toFixed(1) + '%</div>';
        html += '</div>';
        html += '</div>';
    });
    
    container.innerHTML = html;
}

function renderMissionsUI() {
    const container = document.getElementById('withdrawalLockCard');
    
    if (!container) {
        return;
    }
    
    if (STATE.user.premium) {
        container.innerHTML = '<div class="premium-unlocked-card"><div class="premium-icon-large">😏</div><h3>' + t('premium.unlocked') + '</h3><p>Instant withdrawal!</p></div>';
        return;
    }
    
    const m = STATE.user.withdrawalMissions;
    
    let html = '';
    html += '<div class="lock-header">';
    html += '<i class="fas fa-' + (STATE.user.withdrawalUnlocked ? 'unlock' : 'lock') + '"></i>';
    html += '<span>' + (STATE.user.withdrawalUnlocked ? '✅ ' + t('withdrawal.unlocked') : '🔒 Withdrawal Locked') + '</span>';
    html += '</div>';
    html += '<div class="missions-list-vertical">';
    
    // Mission 1
    html += '<div class="mission-card ' + (m.mission1.completed ? 'completed' : '') + '">';
    html += '<div class="mission-icon">' + (m.mission1.completed ? '✅' : '1️⃣') + '</div>';
    html += '<div class="mission-content">';
    html += '<h4>' + MISSIONS.mission1.title + '</h4>';
    
    if (STATE.user.settings && STATE.user.settings.solanaWallet) {
        html += '<p>Wallet: ' + STATE.user.settings.solanaWallet.slice(0, 8) + '...</p>';
    } else {
        html += '<p>' + MISSIONS.mission1.desc + '</p>';
    }
    
    if (!m.mission1.completed) {
        html += '<button class="mission-action-btn" onclick="showSolanaWalletModal()">Add Wallet</button>';
    }
    
    html += '</div>';
    html += '</div>';
    
    // Mission 2
    if (m.mission2.revealed) {
        const progress = (m.mission2.currentAmount / 12500) * 100;
        
        html += '<div class="mission-card ' + (m.mission2.completed ? 'completed' : '') + '">';
        html += '<div class="mission-icon">' + (m.mission2.completed ? '✅' : '2️⃣') + '</div>';
        html += '<div class="mission-content">';
        html += '<h4>' + MISSIONS.mission2.title + '</h4>';
        html += '<p>' + m.mission2.currentAmount.toLocaleString() + ' / 12,500 TROLL</p>';
        html += '<div class="progress-bar small">';
        html += '<div class="progress-fill" style="width:' + progress + '%"></div>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
    } else {
        html += '<div class="mission-card mystery">';
        html += '<div class="mission-icon">❓</div>';
        html += '<div class="mission-content">';
        html += '<h4>Mission 2: ???</h4>';
        html += '<p>' + t('mission.revealLater') + '</p>';
        html += '</div>';
        html += '</div>';
    }
    
    // Mission 3
    if (m.mission3.revealed) {
        const progress = (m.mission3.currentNewReferrals / 12) * 100;
        
        html += '<div class="mission-card ' + (m.mission3.completed ? 'completed' : '') + '">';
        html += '<div class="mission-icon">' + (m.mission3.completed ? '✅' : '3️⃣') + '</div>';
        html += '<div class="mission-content">';
        html += '<h4>' + MISSIONS.mission3.title + '</h4>';
        html += '<p>' + m.mission3.currentNewReferrals + ' / 12 new referrals</p>';
        html += '<div class="progress-bar small">';
        html += '<div class="progress-fill" style="width:' + progress + '%"></div>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
    } else {
        html += '<div class="mission-card mystery">';
        html += '<div class="mission-icon">❓</div>';
        html += '<div class="mission-content">';
        html += '<h4>Mission 3: ???</h4>';
        html += '<p>' + t('mission.revealLater') + '</p>';
        html += '</div>';
        html += '</div>';
    }
    
    // Mission 4
    if (m.mission4.revealed) {
        const bnb = STATE.user.balances.BNB || 0;
        const sol = STATE.user.balances.SOL || 0;
        
        html += '<div class="mission-card ' + (m.mission4.completed ? 'completed' : '') + '">';
        html += '<div class="mission-icon">' + (m.mission4.completed ? '✅' : '4️⃣') + '</div>';
        html += '<div class="mission-content">';
        html += '<h4>' + MISSIONS.mission4.title + '</h4>';
        html += '<p>BNB: ' + bnb.toFixed(4) + '/0.025 | SOL: ' + sol.toFixed(4) + '/0.25</p>';
        html += '</div>';
        html += '</div>';
    } else if (m.mission3.completed) {
        const revealDate = new Date(m.mission4.revealDate);
        const now = new Date();
        const daysLeft = Math.max(0, Math.ceil((revealDate - now) / 86400000));
        
        html += '<div class="mission-card mystery-timer">';
        html += '<div class="mission-icon">⏳</div>';
        html += '<div class="mission-content">';
        html += '<h4>Final Mystery Mission</h4>';
        html += '<p>' + t('mission.waitDays', { days: daysLeft }) + '</p>';
        html += '<div class="timer-progress-bar">';
        html += '<div class="timer-fill" style="width:' + ((20 - daysLeft) / 20) * 100 + '%"></div>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
    } else {
        html += '<div class="mission-card mystery">';
        html += '<div class="mission-icon">❓</div>';
        html += '<div class="mission-content">';
        html += '<h4>Mission 4: ???</h4>';
        html += '<p>' + t('mission.revealLater') + '</p>';
        html += '</div>';
        html += '</div>';
    }
    
    html += '</div>';
    
    container.innerHTML = html;
}

function renderMilestones() {
    const container = document.getElementById('milestonesList');
    
    if (!container) {
        return;
    }
    
    let html = '';
    
    MILESTONES.forEach(function(milestone) {
        const progress = Math.min(((STATE.user.inviteCount || 0) / milestone.referrals) * 100, 100);
        const claimed = STATE.user.claimedMilestones ? STATE.user.claimedMilestones.includes(milestone.referrals) : false;
        const canClaim = (STATE.user.inviteCount || 0) >= milestone.referrals && !claimed && !milestone.isSpecial;
        
        html += '<div class="milestone-item ' + (claimed ? 'claimed' : '') + '">';
        html += '<div class="milestone-header">';
        html += '<span>' + milestone.title + '</span>';
        html += '<span>' + (milestone.isSpecial ? '🎁' : milestone.reward.toLocaleString() + ' TROLL') + '</span>';
        html += '</div>';
        html += '<div class="progress-bar">';
        html += '<div class="progress-fill" style="width:' + progress + '%"></div>';
        html += '</div>';
        html += '<span class="progress-text">' + (STATE.user.inviteCount || 0) + '/' + milestone.referrals + '</span>';
        
        if (canClaim) {
            html += '<button class="claim-btn" onclick="claimMilestone(' + milestone.referrals + ')">Claim</button>';
        }
        
        if (claimed) {
            html += '<p style="color:#2ecc71;text-align:center;">✓ Claimed</p>';
        }
        
        html += '</div>';
    });
    
    container.innerHTML = html;
}

function renderSettings() {
    document.getElementById('settingsUserName').textContent = STATE.user ? STATE.user.userName : 'Troll';
    document.getElementById('settingsUserId').textContent = 'ID: ' + STATE.userId;
    
    const avatar = document.getElementById('settingsAvatar');
    
    if (avatar) {
        if (STATE.user && STATE.user.premium) {
            avatar.textContent = '😏';
        } else {
            avatar.textContent = STATE.user ? STATE.user.avatar : '🧌';
        }
    }
    
    const wallet = STATE.user && STATE.user.settings ? STATE.user.settings.solanaWallet : null;
    const walletEl = document.getElementById('currentSolanaWallet');
    
    if (walletEl) {
        if (wallet) {
            walletEl.textContent = wallet.slice(0, 8) + '...';
        } else {
            walletEl.textContent = 'Not set';
        }
    }
    
    const tonEl = document.getElementById('tonWalletStatus');
    
    if (tonEl) {
        if (STATE.tonConnected && STATE.tonAddress) {
            tonEl.textContent = STATE.tonAddress.slice(0, 6) + '...' + STATE.tonAddress.slice(-6);
            tonEl.style.color = '#2ecc71';
        } else {
            tonEl.textContent = 'Not connected';
            tonEl.style.color = '';
        }
    }
}

function addAdminCrown() {
    const header = document.querySelector('.header-actions');
    
    if (!header) {
        return;
    }
    
    if (document.getElementById('adminCrownBtn')) {
        return;
    }
    
    const btn = document.createElement('button');
    btn.id = 'adminCrownBtn';
    btn.className = 'icon-btn';
    btn.innerHTML = '<i class="fas fa-crown" style="color: gold;"></i>';
    btn.onclick = function() {
        showModal('adminPanel');
    };
    
    header.insertBefore(btn, header.firstChild);
}

// ============================================================================
// SECTION 17: USER ACTIONS
// ============================================================================

function showSolanaWalletModal() {
    const address = prompt('Enter your Solana wallet address (TROLL token):');
    
    if (address && address.length > 30) {
        if (!STATE.user.settings) {
            STATE.user.settings = {};
        }
        
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
    
    // Mission 1
    if (!m.mission1.completed && STATE.user.settings && STATE.user.settings.solanaWallet) {
        m.mission1.completed = true;
        m.mission2.revealed = true;
        changed = true;
    }
    
    // Mission 2
    if (m.mission2.revealed && !m.mission2.completed) {
        m.mission2.currentAmount = STATE.user.referralEarnings || 0;
        
        if (m.mission2.currentAmount >= m.mission2.requiredAmount) {
            m.mission2.completed = true;
            m.mission3.revealed = true;
            m.mission3.referralsAtStart = STATE.user.inviteCount || 0;
            changed = true;
        }
    }
    
    // Mission 3
    if (m.mission3.revealed && !m.mission3.completed) {
        m.mission3.currentNewReferrals = Math.max(0, (STATE.user.inviteCount || 0) - (m.mission3.referralsAtStart || 0));
        
        if (m.mission3.currentNewReferrals >= m.mission3.requiredReferrals) {
            m.mission3.completed = true;
            
            const revealDate = new Date();
            revealDate.setDate(revealDate.getDate() + 20);
            m.mission4.revealDate = revealDate.toISOString();
            
            changed = true;
        }
    }
    
    // Mission 4 - Reveal
    if (m.mission3.completed && !m.mission4.revealed) {
        if (new Date() >= new Date(m.mission4.revealDate)) {
            m.mission4.revealed = true;
            changed = true;
        }
    }
    
    // Mission 4 - Complete
    if (m.mission4.revealed && !m.mission4.completed) {
        const bnb = STATE.user.balances.BNB || 0;
        const sol = STATE.user.balances.SOL || 0;
        
        if (bnb >= m.mission4.requiredBNB || sol >= m.mission4.requiredSOL) {
            m.mission4.completed = true;
            changed = true;
        }
    }
    
    // Unlock withdrawal
    const allDone = m.mission1.completed && m.mission2.completed && m.mission3.completed && m.mission4.completed;
    
    if (allDone && !STATE.user.withdrawalUnlocked) {
        STATE.user.withdrawalUnlocked = true;
        changed = true;
        showToast('🎉 Withdrawal Unlocked!', 'success');
    }
    
    if (changed) {
        await saveUserData();
    }
}

async function claimMilestone(referrals) {
    const milestone = MILESTONES.find(function(m) {
        return m.referrals === referrals;
    });
    
    if (!milestone || milestone.isSpecial) {
        return;
    }
    
    if ((STATE.user.inviteCount || 0) < referrals) {
        showToast('Need ' + referrals + ' referrals', 'error');
        return;
    }
    
    if (STATE.user.claimedMilestones && STATE.user.claimedMilestones.includes(referrals)) {
        return;
    }
    
    STATE.user.balances.TROLL += milestone.reward;
    STATE.user.totalEarned += milestone.reward;
    
    if (!STATE.user.claimedMilestones) {
        STATE.user.claimedMilestones = [];
    }
    
    STATE.user.claimedMilestones.push(referrals);
    
    await saveUserData();
    renderUI();
    
    showToast('✅ Claimed ' + milestone.reward.toLocaleString() + ' TROLL!', 'success');
}

function copyInviteLink() {
    const link = document.getElementById('inviteLink');
    
    if (link) {
        copyToClipboard(link.value);
    }
}

function shareInviteLink() {
    const link = document.getElementById('inviteLink').value;
    const text = encodeURIComponent('🧌 Join Troll Army! Get 1000 TROLL bonus!\n\n👉 ' + link);
    
    if (tg) {
        tg.openTelegramLink('https://t.me/share/url?url=&text=' + text);
    }
}

// ============================================================================
// SECTION 18: COINPAYMENTS DEPOSIT & WITHDRAW
// ============================================================================

function showDepositModal() {
    showModal('depositModal');
    document.getElementById('depositAddress').textContent = '0xbf70420f57342c6Bd4267430D4D3b7E946f09450';
}

function copyDepositAddress() {
    const address = document.getElementById('depositAddress');
    
    if (address) {
        copyToClipboard(address.textContent);
    }
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
// SECTION 19: TON CONNECT & PREMIUM
// ============================================================================

async function initTON() {
    if (typeof TON_CONNECT_UI === 'undefined') {
        return;
    }
    
    try {
        STATE.tonUI = new TON_CONNECT_UI.TonConnectUI({
            manifestUrl: location.origin + '/tonconnect-manifest.json',
            buttonRootId: 'tonConnectButton'
        });
        
        const restored = await STATE.tonUI.connectionRestored;
        
        if (restored && STATE.tonUI.wallet) {
            STATE.tonConnected = true;
            STATE.tonAddress = STATE.tonUI.wallet.account.address;
        }
    } catch (error) {
        log('TON init error:', error);
    }
}

async function connectTON() {
    if (!STATE.tonUI) {
        return;
    }
    
    try {
        await STATE.tonUI.openModal();
        
        const interval = setInterval(function() {
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
        
        setTimeout(function() {
            clearInterval(interval);
        }, 30000);
    } catch (error) {
        showToast('Connection failed', 'error');
    }
}

function showPremiumModal() {
    showModal('premiumModal');
}

async function buyPremium() {
    if (!STATE.tonConnected) {
        showToast('Connect TON first', 'error');
        return;
    }
    
    try {
        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 300,
            messages: [{
                address: CONFIG.OWNER_WALLET,
                amount: '5000000000'
            }]
        };
        
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
    } catch (error) {
        showToast('Payment failed', 'error');
    }
}

// ============================================================================
// SECTION 20: NAVIGATION
// ============================================================================

function showWallet() {
    STATE.currentPage = 'wallet';
    
    document.querySelectorAll('.section').forEach(function(s) {
        s.classList.add('hidden');
    });
    
    showElement('walletSection');
    
    document.querySelectorAll('.nav-item').forEach(function(n) {
        n.classList.remove('active');
    });
    
    document.querySelector('[data-tab="wallet"]').classList.add('active');
    
    renderUI();
}

function showAirdrop() {
    STATE.currentPage = 'airdrop';
    
    document.querySelectorAll('.section').forEach(function(s) {
        s.classList.add('hidden');
    });
    
    showElement('airdropSection');
    
    document.querySelectorAll('.nav-item').forEach(function(n) {
        n.classList.remove('active');
    });
    
    document.querySelector('[data-tab="airdrop"]').classList.add('active');
    
    renderUI();
}

function showSettings() {
    STATE.currentPage = 'settings';
    
    document.querySelectorAll('.section').forEach(function(s) {
        s.classList.add('hidden');
    });
    
    showElement('settingsSection');
    
    document.querySelectorAll('.nav-item').forEach(function(n) {
        n.classList.remove('active');
    });
    
    document.querySelector('[data-tab="settings"]').classList.add('active');
    
    renderSettings();
}

// ============================================================================
// SECTION 21: HELPERS
// ============================================================================

function showAssetDetails(symbol) {
    const balance = STATE.user.balances[symbol] || 0;
    showToast(symbol + ': ' + formatBalance(balance, symbol), 'info');
}

function showCryptoDetails(symbol) {
    const data = STATE.prices[symbol] || { price: 0, change: 0 };
    const changeSymbol = data.change >= 0 ? '+' : '';
    showToast(symbol + ': $' + data.price.toFixed(6) + ' (' + changeSymbol + data.change.toFixed(1) + '%)', 'info');
}

function refreshPrices() {
    fetchLivePrices(true);
    showToast('Prices refreshed!', 'success');
}

function toggleLanguage() {
    if (STATE.language === 'en') {
        STATE.language = 'ar';
    } else {
        STATE.language = 'en';
    }
    
    localStorage.setItem('language', STATE.language);
    location.reload();
}

function toggleTheme() {
    if (STATE.theme === 'dark') {
        STATE.theme = 'light';
    } else {
        STATE.theme = 'dark';
    }
    
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

function showComingSoon(feature) {
    showToast(feature + ' coming soon!', 'info');
}

// ============================================================================
// SECTION 22: START APPLICATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async function() {
    document.documentElement.setAttribute('data-theme', STATE.theme);
    
    if (STATE.language === 'ar') {
        document.body.classList.add('rtl');
        document.documentElement.dir = 'rtl';
    }
    
    setTimeout(function() {
        initializeApp();
    }, 500);
    
    await initTON();
});

// ============================================================================
// SECTION 23: GLOBAL EXPORTS
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
window.showComingSoon = showComingSoon;

console.log('✅✅✅ TROLL ARMY - PROFESSIONAL VERSION LOADED! ✅✅✅');
