// ============================================================================
// TROLL ARMY - FINAL PRODUCTION VERSION
// Version: 24.0 - Fixed Referral System + All Features
// ============================================================================

// ============================================================================
// SECTION 1: TELEGRAM WEBAPP INITIALIZATION
// ============================================================================

const tg = window.Telegram?.WebApp;

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
// SECTION 9: API CALL
// ============================================================================

async function apiCall(endpoint, method, body) {
    const options = {
        method: method,
        headers: { 'Content-Type': 'application/json' }
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
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
// SECTION 10: LOAD CONFIG
// ============================================================================

async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        appConfig = await response.json();
        
        if (appConfig.firebaseConfig && typeof firebase !== 'undefined') {
            if (!firebase.apps.length) {
                firebase.initializeApp(appConfig.firebaseConfig);
            }
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
// SECTION 11: COINGECKO LIVE PRICES
// ============================================================================

let lastPriceFetch = 0;

async function fetchLivePrices(force = false) {
    const now = Date.now();
    
    if (!force && lastPriceFetch && (now - lastPriceFetch) < 300000) {
        return;
    }
    
    console.log('🔄 Fetching CoinGecko prices...');
    
    try {
        const allCoins = [...ALL_ASSETS, ...MEME_COINS];
        const ids = allCoins.map(function(c) {
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
        }).filter(function(id) {
            return id !== '';
        }).join(',');
        
        const url = 'https://api.coingecko.com/api/v3/simple/price?ids=' + ids + '&vs_currencies=usd&include_24hr_change=true';
        const res = await fetch(url);
        const data = await res.json();
        
        allCoins.forEach(function(coin) {
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
            cryptoPrices['TROLL'] = {
                price: CONFIG.TROLL_PRICE_FALLBACK,
                change: 0
            };
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
        cryptoPrices['TROLL'] = {
            price: CONFIG.TROLL_PRICE_FALLBACK,
            change: 0
        };
    }
}

// ============================================================================
// SECTION 12: TELEGRAM USER DETECTION
// ============================================================================

async function waitForTelegramUserData(maxAttempts = 15, delayMs = 200) {
    console.log('⏳ Waiting for Telegram user data...');
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log('🔍 Attempt ' + attempt + '/' + maxAttempts);
        
        if (tg) {
            tg.ready();
            tg.expand();
            
            if (tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.id) {
                const user = tg.initDataUnsafe.user;
                console.log('✅ Found user in initDataUnsafe after ' + attempt + ' attempt(s):', user.id);
                
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
                        
                        if (user && user.id) {
                            console.log('✅ Found user in initData after ' + attempt + ' attempt(s):', user.id);
                            
                            return {
                                id: user.id.toString(),
                                firstName: user.first_name || 'Troll',
                                lastName: user.last_name || '',
                                username: user.username || '',
                                initData: tg.initData
                            };
                        }
                    }
                } catch (e) {
                    console.warn('⚠️ Error parsing initData:', e);
                }
            }
        }
        
        await new Promise(function(resolve) {
            setTimeout(resolve, delayMs);
        });
    }
    
    console.log('❌ No Telegram user found after', maxAttempts, 'attempts');
    return null;
}

function buildInitDataFromUnsafe(unsafe) {
    if (!unsafe) {
        return '';
    }
    
    const data = {
        query_id: unsafe.query_id,
        user: JSON.stringify(unsafe.user),
        auth_date: unsafe.auth_date,
        hash: unsafe.hash
    };
    
    return Object.keys(data)
        .filter(function(k) {
            return data[k] !== undefined && data[k] !== null;
        })
        .map(function(k) {
            return k + '=' + encodeURIComponent(data[k]);
        })
        .join('&');
}

// ✅✅✅ FIXED: Read referral from start_param (Telegram official way)
function getReferralFromUrl() {
    // First priority: Telegram start_param (correct way)
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param) {
        console.log('🔗 Referral from start_param:', tg.initDataUnsafe.start_param);
        return tg.initDataUnsafe.start_param;
    }
    
    // Fallback: URL parameters
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('startapp') || params.get('startapp') || params.get('ref') || null;
    
    if (ref) {
        console.log('🔗 Referral from URL:', ref);
    }
    
    return ref;
}

// ============================================================================
// SECTION 13: USER INITIALIZATION
// ============================================================================

async function initUser() {
    console.log('🚀 Initializing user...');
    
    const telegramUser = await waitForTelegramUserData(15, 200);
    
    if (!telegramUser) {
        console.log('❌ No Telegram user detected - switching to guest mode');
        await createGuestUser();
        return;
    }
    
    console.log('📤 Authenticating with server...');
    
    try {
        const response = await fetch('/api/init-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: telegramUser.initData })
        });
        
        const data = await response.json();
        console.log('📥 Server response:', data.success ? '✅ Success' : '❌ Failed');
        
        if (data.success) {
            console.log('✅ Authenticated:', data.userId);
            
            currentUser = data.userData;
            currentUserId = data.userId;
            isGuest = false;
            
            localStorage.setItem('troll_user_id', data.userId);
            localStorage.setItem('troll_user_data', JSON.stringify(data.userData));
            
            // ✅ Process referral
            const refCode = getReferralFromUrl();
            
            if (refCode && refCode !== currentUserId) {
                console.log('🔗 Processing referral from:', refCode);
                await processReferral(refCode);
            }
            
            hideAllScreens();
            showMainApp();
            updateUI();
            checkAdmin();
            
            showToast('Welcome ' + data.userData.userName + '! +' + data.userData.balances.TROLL + ' TROLL', 'success');
        } else {
            console.log('❌ Auth failed:', data.error);
            await createGuestUser();
        }
    } catch (error) {
        console.error('❌ Server error:', error);
        await createGuestUser();
    }
}

// ============================================================================
// SECTION 14: REFERRAL PROCESSING
// ============================================================================

async function processReferral(refCode) {
    if (!refCode) {
        console.log('❌ No referral code');
        return;
    }
    
    if (refCode === currentUserId) {
        console.log('❌ Cannot refer yourself');
        return;
    }
    
    if (currentUser.referredBy) {
        console.log('❌ Already referred by:', currentUser.referredBy);
        return;
    }
    
    console.log('🔗 Processing referral:', refCode, '→', currentUserId);
    
    try {
        const response = await apiCall('/referral', 'POST', {
            referrerId: refCode,
            newUserId: currentUserId
        });
        
        console.log('📥 Referral API response:', response);
        
        if (response.success) {
            currentUser.referredBy = refCode;
            currentUser.balances.TROLL += CONFIG.REFERRAL_BONUS;
            currentUser.referralEarnings += CONFIG.REFERRAL_BONUS;
            currentUser.totalEarned += CONFIG.REFERRAL_BONUS;
            
            await saveUserData();
            
            showToast('🎉 +' + CONFIG.REFERRAL_BONUS + ' TROLL from referral!', 'success');
            console.log('✅ Referral processed successfully');
        } else {
            console.error('❌ Referral API failed:', response.error);
        }
    } catch (error) {
        console.error('❌ Referral error:', error);
    }
}

// ============================================================================
// SECTION 15: GUEST USER
// ============================================================================

async function createGuestUser() {
    console.log('🎭 Creating guest user...');
    
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
        console.log('✅ Guest saved to database');
    } catch (e) {
        console.log('⚠️ Guest saved locally only');
    }
    
    hideAllScreens();
    showMainApp();
    updateUI();
    showToast('Guest Mode - Connect Telegram for full access', 'info');
}

// ============================================================================
// SECTION 16: UI HELPERS
// ============================================================================

function hideAllScreens() {
    const screens = ['onboardingScreen', 'guestOnboardingScreen', 'splashScreen'];
    
    screens.forEach(function(id) {
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
    const isAdmin = (currentUserId === appConfig.adminId);
    
    if (isAdmin) {
        const header = document.querySelector('.header-actions');
        
        if (header && !document.getElementById('adminCrownBtn')) {
            const btn = document.createElement('button');
            btn.id = 'adminCrownBtn';
            btn.className = 'icon-btn';
            btn.innerHTML = '<i class="fa-solid fa-crown" style="color: gold;"></i>';
            btn.onclick = showAdminPanel;
            header.insertBefore(btn, header.firstChild);
        }
    }
}

// ============================================================================
// SECTION 17: MAIN UI UPDATE
// ============================================================================

function updateUI() {
    if (!currentUser) return;
    
    document.getElementById('userName').textContent = currentUser.userName || 'User';
    document.getElementById('userIdDisplay').textContent = 'ID: ' + (currentUserId || '').slice(-8);
    
    const avatarEl = document.getElementById('userAvatar');
    
    if (avatarEl) {
        if (currentUser.premium) {
            avatarEl.innerHTML = getTrollFaceSVG();
            avatarEl.classList.add('avatar-premium');
        } else {
            avatarEl.textContent = currentUser.avatar || '🧌';
        }
    }
    
    const troll = currentUser.balances.TROLL || 0;
    document.getElementById('trollBalance').textContent = troll.toLocaleString();
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
    
    ALL_ASSETS.forEach(function(asset) {
        const balance = currentUser.balances[asset.symbol] || 0;
        const price = cryptoPrices[asset.symbol] ? cryptoPrices[asset.symbol].price : 0;
        total += balance * price;
    });
    
    const totalEl = document.getElementById('totalBalance');
    if (totalEl) totalEl.textContent = '$' + total.toFixed(2);
    
    const trollBalance = currentUser.balances.TROLL || 0;
    const trollPrice = cryptoPrices['TROLL'] ? cryptoPrices['TROLL'].price : CONFIG.TROLL_PRICE_FALLBACK;
    const usdEl = document.getElementById('trollUsdValue');
    if (usdEl) usdEl.textContent = (trollBalance * trollPrice).toFixed(2);
}

function getTrollFaceSVG() {
    return '<svg viewBox="0 0 100 100" width="40" height="40">' +
        '<defs><radialGradient id="g"><stop offset="0%" stop-color="#FFD700"/><stop offset="100%" stop-color="#DAA520"/></radialGradient></defs>' +
        '<circle cx="50" cy="50" r="48" fill="url(#g)"/>' +
        '<path d="M28 68 Q50 88,78 58 Q82 52,75 48 Q58 70,28 62Z" fill="#2C1810"/>' +
        '<ellipse cx="35" cy="40" rx="8" ry="10" fill="#FFF"/><circle cx="38" cy="40" r="3"/>' +
        '<ellipse cx="65" cy="40" rx="8" ry="10" fill="#FFF"/><circle cx="62" cy="42" r="3"/>' +
        '</svg>';
}

function updateSettingsUI() {
    const avatarEl = document.getElementById('settingsAvatar');
    
    if (avatarEl) {
        if (currentUser.premium) {
            avatarEl.innerHTML = getTrollFaceSVG();
        } else {
            avatarEl.textContent = currentUser.avatar || '🧌';
        }
    }
    
    document.getElementById('settingsUserName').textContent = currentUser.userName || 'User';
    document.getElementById('settingsUserId').textContent = 'ID: ' + currentUserId;
    
    const wallet = currentUser.settings ? currentUser.settings.solanaWallet : null;
    document.getElementById('currentSolanaWallet').textContent = wallet ? wallet.slice(0, 8) + '...' + wallet.slice(-4) : 'Not set';
    
    const tonEl = document.getElementById('tonWalletStatus');
    
    if (tonEl) {
        if (tonConnected && tonWalletAddress) {
            tonEl.textContent = tonWalletAddress.slice(0, 6) + '...' + tonWalletAddress.slice(-6);
            tonEl.style.color = '#2ecc71';
        } else {
            tonEl.textContent = 'Not connected';
            tonEl.style.color = '';
        }
    }
}

function getReferralLink() {
    if (!currentUserId || currentUserId.startsWith('guest_')) {
        return CONFIG.BOT_LINK;
    }
    
    return CONFIG.BOT_LINK + '?startapp=' + currentUserId;
}

// ============================================================================
// SECTION 18: RENDER FUNCTIONS
// ============================================================================

function renderAssets() {
    const container = document.getElementById('assetsList');
    if (!container) return;
    
    let html = '';
    
    for (let i = 0; i < ALL_ASSETS.length; i++) {
        const asset = ALL_ASSETS[i];
        const balance = currentUser.balances[asset.symbol] || 0;
        const price = cryptoPrices[asset.symbol] ? cryptoPrices[asset.symbol].price : 0;
        const value = balance * price;
        
        html += '<div class="asset-item" onclick="showAssetDetails(\'' + asset.symbol + '\')">';
        html += '<div class="asset-left">';
        html += '<img src="' + (ICONS[asset.symbol] || ICONS.TROLL) + '" class="asset-icon-img">';
        html += '<div class="asset-info">';
        html += '<h4>' + asset.name + '</h4>';
        html += '<p>' + asset.symbol + '</p>';
        html += '</div>';
        html += '</div>';
        html += '<div class="asset-right">';
        html += '<div class="asset-balance">' + balance.toLocaleString() + ' ' + asset.symbol + '</div>';
        html += '<div class="asset-value">$' + value.toFixed(2) + '</div>';
        html += '</div>';
        html += '</div>';
    }
    
    container.innerHTML = html;
}

function renderTopCryptos() {
    const container = document.getElementById('topCryptoList');
    if (!container) return;
    
    const topCoins = ALL_ASSETS.filter(function(a) {
        return a.symbol === 'TROLL' || a.symbol === 'BTC' || a.symbol === 'ETH' || a.symbol === 'BNB' || a.symbol === 'SOL';
    });
    
    let html = '';
    
    for (let i = 0; i < topCoins.length; i++) {
        const coin = topCoins[i];
        const data = cryptoPrices[coin.symbol] || { price: 0, change: 0 };
        const changeClass = data.change >= 0 ? 'positive' : 'negative';
        const changeSymbol = data.change >= 0 ? '+' : '';
        const decimals = coin.symbol === 'TROLL' ? 5 : 2;
        
        html += '<div class="crypto-item" onclick="showCryptoDetails(\'' + coin.symbol + '\')">';
        html += '<div class="crypto-left">';
        html += '<img src="' + ICONS[coin.symbol] + '" class="crypto-icon-img">';
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
    }
    
    container.innerHTML = html;
}

function renderMemeCoins() {
    const container = document.getElementById('memeCoinList');
    if (!container) return;
    
    let html = '';
    
    for (let i = 0; i < MEME_COINS.length; i++) {
        const coin = MEME_COINS[i];
        const data = cryptoPrices[coin.symbol] || { price: 0, change: 0 };
        const changeClass = data.change >= 0 ? 'positive' : 'negative';
        const changeSymbol = data.change >= 0 ? '+' : '';
        
        html += '<div class="crypto-item" onclick="showCryptoDetails(\'' + coin.symbol + '\')">';
        html += '<div class="crypto-left">';
        html += '<img src="' + ICONS[coin.symbol] + '" class="crypto-icon-img">';
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
    }
    
    container.innerHTML = html;
}

function renderMissionsUI() {
    const container = document.getElementById('withdrawalLockCard');
    if (!container) return;
    
    if (currentUser.premium) {
        container.innerHTML = '<div class="premium-unlocked-card"><div class="premium-icon-large">😏</div><h3>Premium Unlocked!</h3><p>Instant withdrawal access!</p></div>';
        return;
    }
    
    const m = currentUser.withdrawalMissions;
    
    let html = '';
    html += '<div class="lock-header">';
    html += '<i class="fa-solid fa-' + (currentUser.withdrawalUnlocked ? 'unlock' : 'lock') + '"></i>';
    html += '<span>' + (currentUser.withdrawalUnlocked ? '✅ Withdrawal Available!' : '🔒 Withdrawal Locked') + '</span>';
    html += '</div>';
    html += '<div class="missions-list-vertical">';
    
    // Mission 1
    html += '<div class="mission-card ' + (m.mission1.completed ? 'completed' : '') + '">';
    html += '<div class="mission-icon">' + (m.mission1.completed ? '✅' : '1️⃣') + '</div>';
    html += '<div class="mission-content">';
    html += '<h4>' + MISSIONS.mission1.title + '</h4>';
    
    if (currentUser.settings && currentUser.settings.solanaWallet) {
        html += '<p>Wallet: ' + currentUser.settings.solanaWallet.slice(0, 8) + '...</p>';
    } else {
        html += '<p>' + MISSIONS.mission1.desc + '</p>';
    }
    
    if (!m.mission1.completed) {
        html += '<button class="mission-action-btn" onclick="showSolanaWalletModal()">Add Wallet</button>';
    }
    
    html += '</div></div>';
    
    // Mission 2
    if (m.mission2.revealed) {
        const prog = (m.mission2.currentAmount / 12500) * 100;
        html += '<div class="mission-card ' + (m.mission2.completed ? 'completed' : '') + '">';
        html += '<div class="mission-icon">' + (m.mission2.completed ? '✅' : '2️⃣') + '</div>';
        html += '<div class="mission-content">';
        html += '<h4>' + MISSIONS.mission2.title + '</h4>';
        html += '<p>' + m.mission2.currentAmount.toLocaleString() + ' / 12,500 TROLL</p>';
        html += '<div class="progress-bar small"><div class="progress-fill" style="width:' + prog + '%"></div></div>';
        html += '<p class="mission-hint">💡 ' + MISSIONS.mission2.hint + '</p>';
        html += '</div></div>';
    } else {
        html += '<div class="mission-card mystery">';
        html += '<div class="mission-icon">❓</div>';
        html += '<div class="mission-content"><h4>Mission 2: ???</h4><p>Reveals after Mission 1</p></div>';
        html += '</div>';
    }
    
    // Mission 3
    if (m.mission3.revealed) {
        const prog = (m.mission3.currentNewReferrals / 12) * 100;
        html += '<div class="mission-card ' + (m.mission3.completed ? 'completed' : '') + '">';
        html += '<div class="mission-icon">' + (m.mission3.completed ? '✅' : '3️⃣') + '</div>';
        html += '<div class="mission-content">';
        html += '<h4>' + MISSIONS.mission3.title + '</h4>';
        html += '<p>' + m.mission3.currentNewReferrals + ' / 12 new referrals</p>';
        html += '<div class="progress-bar small"><div class="progress-fill" style="width:' + prog + '%"></div></div>';
        html += '<p class="mission-hint">💡 ' + MISSIONS.mission3.hint + '</p>';
        html += '</div></div>';
    } else {
        html += '<div class="mission-card mystery">';
        html += '<div class="mission-icon">❓</div>';
        html += '<div class="mission-content"><h4>Mission 3: ???</h4><p>Reveals after Mission 2</p></div>';
        html += '</div>';
    }
    
    // Mission 4
    if (m.mission4.revealed) {
        const bnb = currentUser.balances.BNB || 0;
        const sol = currentUser.balances.SOL || 0;
        html += '<div class="mission-card ' + (m.mission4.completed ? 'completed' : '') + '">';
        html += '<div class="mission-icon">' + (m.mission4.completed ? '✅' : '4️⃣') + '</div>';
        html += '<div class="mission-content">';
        html += '<h4>' + MISSIONS.mission4.title + '</h4>';
        html += '<p>BNB: ' + bnb.toFixed(4) + '/0.025 | SOL: ' + sol.toFixed(4) + '/0.25</p>';
        html += '<p class="mission-hint">💡 ' + MISSIONS.mission4.hint + '</p>';
        html += '</div></div>';
    } else if (m.mission3.completed) {
        const revealDate = new Date(m.mission4.revealDate);
        const now = new Date();
        const daysLeft = Math.max(0, Math.ceil((revealDate - now) / (1000 * 60 * 60 * 24)));
        html += '<div class="mission-card mystery-timer">';
        html += '<div class="mission-icon">⏳</div>';
        html += '<div class="mission-content">';
        html += '<h4>Final Mystery Mission</h4>';
        html += '<p>Reveals in ' + daysLeft + ' day' + (daysLeft !== 1 ? 's' : '') + '</p>';
        html += '<div class="timer-progress-bar"><div class="timer-fill" style="width:' + ((20 - daysLeft) / 20) * 100 + '%"></div></div>';
        html += '</div></div>';
    } else {
        html += '<div class="mission-card mystery">';
        html += '<div class="mission-icon">❓</div>';
        html += '<div class="mission-content"><h4>Mission 4: ???</h4><p>Reveals after Mission 3</p></div>';
        html += '</div>';
    }
    
    html += '</div>';
    container.innerHTML = html;
}

function renderMilestones() {
    const container = document.getElementById('milestonesList');
    if (!container) return;
    
    let html = '';
    
    for (let i = 0; i < MILESTONES.length; i++) {
        const m = MILESTONES[i];
        const progress = Math.min(((currentUser.inviteCount || 0) / m.referrals) * 100, 100);
        const claimed = currentUser.claimedMilestones ? currentUser.claimedMilestones.includes(m.referrals) : false;
        const canClaim = (currentUser.inviteCount >= m.referrals) && !claimed && !m.isSpecial;
        
        html += '<div class="milestone-item ' + (claimed ? 'claimed' : '') + '">';
        html += '<div class="milestone-header">';
        html += '<span>' + m.title + '</span>';
        html += '<span>' + (m.isSpecial ? '🎁 Mystery Box' : m.reward.toLocaleString() + ' TROLL') + '</span>';
        html += '</div>';
        html += '<div class="progress-bar"><div class="progress-fill" style="width:' + progress + '%"></div></div>';
        html += '<div class="progress-text">' + (currentUser.inviteCount || 0) + '/' + m.referrals + '</div>';
        
        if (canClaim) {
            html += '<button class="claim-btn" onclick="claimMilestone(' + m.referrals + ')">Claim</button>';
        }
        
        if (claimed) {
            html += '<p style="color:#2ecc71;text-align:center;">✓ Claimed</p>';
        }
        
        html += '</div>';
    }
    
    container.innerHTML = html;
}

// ============================================================================
// SECTION 19: DATA PERSISTENCE
// ============================================================================

async function saveUserData() {
    localStorage.setItem('troll_user_data', JSON.stringify(currentUser));
    
    if (!isGuest) {
        await apiCall('/users/' + currentUserId, 'PATCH', { updates: currentUser });
    }
}

// ============================================================================
// SECTION 20: MISSIONS PROGRESS
// ============================================================================

async function updateMissionsProgress() {
    const m = currentUser.withdrawalMissions;
    let changed = false;
    
    if (!m.mission1.completed && currentUser.settings && currentUser.settings.solanaWallet) {
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
        showToast('🎉 Withdrawal Unlocked!', 'success');
    }
    
    if (changed) {
        await saveUserData();
    }
}

// ============================================================================
// SECTION 21: USER ACTIONS
// ============================================================================

function showSolanaWalletModal() {
    const address = prompt('Enter your Solana wallet address (TROLL token):');
    
    if (address && address.length > 30) {
        if (!currentUser.settings) currentUser.settings = {};
        currentUser.settings.solanaWallet = address;
        
        saveUserData();
        updateMissionsProgress();
        updateUI();
        
        if (currentPage === 'airdrop') renderMissionsUI();
        showToast('✅ Wallet saved!', 'success');
    } else if (address) {
        showToast('Invalid address', 'error');
    }
}

function copyInviteLink() {
    const link = document.getElementById('inviteLink');
    if (link) {
        navigator.clipboard.writeText(link.value);
        showToast('🔗 Link copied!', 'success');
    }
}

function shareInviteLink() {
    const link = getReferralLink();
    const text = encodeURIComponent('🧌 Join Troll Army! Get 1000 TROLL bonus!\n\n👉 ' + link);
    
    if (tg) {
        tg.openTelegramLink('https://t.me/share/url?url=&text=' + text);
    }
}

async function claimMilestone(referrals) {
    const milestone = MILESTONES.find(function(m) { return m.referrals === referrals; });
    
    if (!milestone || milestone.isSpecial) return;
    
    if (!currentUser.claimedMilestones) currentUser.claimedMilestones = [];
    if (currentUser.claimedMilestones.includes(referrals)) return;
    if (currentUser.inviteCount < referrals) {
        showToast('Not enough referrals', 'error');
        return;
    }
    
    currentUser.balances.TROLL += milestone.reward;
    currentUser.claimedMilestones.push(referrals);
    
    await saveUserData();
    updateUI();
    renderMilestones();
    
    showToast('🎉 Claimed ' + milestone.reward.toLocaleString() + ' TROLL!', 'success');
}

function showToast(message, type) {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toastMessage');
    
    if (!toast || !msgEl) return;
    
    msgEl.textContent = message;
    toast.classList.remove('hidden');
    
    const icon = toast.querySelector('i');
    if (icon) {
        icon.className = type === 'error' ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-check';
    }
    
    setTimeout(function() { toast.classList.add('hidden'); }, 3000);
}

// ============================================================================
// SECTION 22: MODAL FUNCTIONS
// ============================================================================

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('show');
}

function showDepositModal() {
    const modal = document.getElementById('depositModal');
    if (modal) modal.classList.add('show');
    
    const addressEl = document.getElementById('depositAddress');
    if (addressEl) addressEl.textContent = '0xbf70420f57342c6Bd4267430D4D3b7E946f09450';
}

function showWithdrawModal() {
    if (!currentUser.withdrawalUnlocked && !currentUser.premium) {
        showToast('Complete missions to unlock withdrawal!', 'error');
        return;
    }
    
    const modal = document.getElementById('withdrawModal');
    if (modal) modal.classList.add('show');
}

function showHistory() {
    const modal = document.getElementById('historyModal');
    if (modal) modal.classList.add('show');
}

function showNotifications() {
    const modal = document.getElementById('notificationsModal');
    if (modal) modal.classList.add('show');
}

function showAdminPanel() {
    const panel = document.getElementById('adminPanel');
    if (panel) panel.classList.remove('hidden');
}

function closeAdminPanel() {
    const panel = document.getElementById('adminPanel');
    if (panel) panel.classList.add('hidden');
}

function copyDepositAddress() {
    const addr = document.getElementById('depositAddress');
    if (addr && addr.textContent) {
        navigator.clipboard.writeText(addr.textContent);
        showToast('Address copied!', 'success');
    }
}

function submitDeposit() {
    showToast('Deposit submitted', 'success');
    closeModal('depositModal');
}

function submitWithdraw() {
    showToast('Withdrawal requested', 'success');
    closeModal('withdrawModal');
}

// ============================================================================
// SECTION 23: NAVIGATION
// ============================================================================

function showWallet() {
    currentPage = 'wallet';
    
    document.querySelectorAll('.section').forEach(function(s) { s.classList.add('hidden'); });
    
    const walletSection = document.getElementById('walletSection');
    if (walletSection) walletSection.classList.remove('hidden');
    
    document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
    
    const walletTab = document.querySelector('[data-tab="wallet"]');
    if (walletTab) walletTab.classList.add('active');
    
    renderAssets();
    renderTopCryptos();
    renderMemeCoins();
    updateTotalBalance();
}

function showAirdrop() {
    currentPage = 'airdrop';
    
    document.querySelectorAll('.section').forEach(function(s) { s.classList.add('hidden'); });
    
    const airdropSection = document.getElementById('airdropSection');
    if (airdropSection) airdropSection.classList.remove('hidden');
    
    document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
    
    const airdropTab = document.querySelector('[data-tab="airdrop"]');
    if (airdropTab) airdropTab.classList.add('active');
    
    renderMissionsUI();
    renderMilestones();
}

function showSettings() {
    currentPage = 'settings';
    
    document.querySelectorAll('.section').forEach(function(s) { s.classList.add('hidden'); });
    
    const settingsSection = document.getElementById('settingsSection');
    if (settingsSection) settingsSection.classList.remove('hidden');
    
    document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
    
    const settingsTab = document.querySelector('[data-tab="settings"]');
    if (settingsTab) settingsTab.classList.add('active');
    
    updateSettingsUI();
}

// ============================================================================
// SECTION 24: TON CONNECT & PREMIUM
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
        }
    } catch (e) {
        console.error('TON init error:', e);
    }
}

async function connectTONWallet() {
    if (!tonConnectUI) return;
    
    try {
        await tonConnectUI.openModal();
        
        const interval = setInterval(function() {
            if (tonConnectUI.wallet) {
                clearInterval(interval);
                
                tonConnected = true;
                tonWalletAddress = tonConnectUI.wallet.account.address;
                currentUser.tonWallet = tonWalletAddress;
                
                saveUserData();
                updateSettingsUI();
                
                showToast('✅ TON Connected!', 'success');
            }
        }, 500);
        
        setTimeout(function() { clearInterval(interval); }, 30000);
    } catch (e) {
        showToast('Connection failed', 'error');
    }
}

function showPremiumModal() {
    const modal = document.getElementById('premiumModal');
    if (modal) modal.classList.add('show');
}

async function buyPremium() {
    if (!tonConnected) {
        showToast('Connect TON wallet first', 'error');
        return;
    }
    
    showToast('Processing...', 'info');
    
    try {
        const tx = {
            validUntil: Math.floor(Date.now() / 1000) + 300,
            messages: [{ address: appConfig.ownerWallet, amount: '5000000000' }]
        };
        
        const result = await tonConnectUI.sendTransaction(tx);
        
        if (result.boc) {
            currentUser.premium = true;
            currentUser.avatar = '😏';
            currentUser.withdrawalUnlocked = true;
            
            await saveUserData();
            updateUI();
            closeModal('premiumModal');
            
            showToast('🎉 Premium Unlocked!', 'success');
        }
    } catch (e) {
        showToast('Payment failed', 'error');
    }
}

// ============================================================================
// SECTION 25: HELPERS
// ============================================================================

function showAssetDetails(symbol) {
    const balance = currentUser.balances[symbol] || 0;
    showToast(symbol + ': ' + balance.toLocaleString(), 'info');
}

function showCryptoDetails(symbol) {
    const data = cryptoPrices[symbol] || { price: 0, change: 0 };
    const changeSymbol = data.change >= 0 ? '+' : '';
    showToast(symbol + ': $' + data.price.toFixed(6) + ' (' + changeSymbol + data.change.toFixed(1) + '%)', 'info');
}

function refreshPrices() {
    fetchLivePrices(true);
    showToast('Prices refreshed!', 'success');
}

function toggleLanguage() {
    showToast('Language changed', 'info');
}

function toggleTheme() {
    const theme = document.documentElement.getAttribute('data-theme');
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    showToast('Theme changed', 'info');
}

function logout() {
    if (confirm('Are you sure?')) {
        localStorage.clear();
        location.reload();
    }
}

function openSupport() {
    window.open('https://t.me/TrollSupport', '_blank');
}

function showComingSoon(feature) {
    showToast(feature + ' coming soon!', 'info');
}

// ============================================================================
// SECTION 26: INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Troll Army Starting - Waiting for Telegram...');
    
    setTimeout(function() {
        const splash = document.getElementById('splashScreen');
        if (splash) splash.classList.add('hidden');
    }, 2000);
    
    await loadConfig();
    await initTONConnect();
    await initUser();
    await fetchLivePrices(true);
    
    setInterval(function() { fetchLivePrices(); }, 300000);
    setInterval(function() { updateMissionsProgress(); }, 30000);
});

// ============================================================================
// SECTION 27: GLOBAL EXPORTS
// ============================================================================

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

console.log('✅✅✅ Troll Army - REFERRAL SYSTEM FIXED! ✅✅✅');
