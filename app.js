// ============================================================
// TROLL ARMY - ULTIMATE AIRDROP SYSTEM v11.0 (FINAL FIXED)
// مدمج من REFI Mini App + Trust Wallet Lite
// ============================================================

// ====== 1. TELEGRAM WEBAPP INITIALIZATION (طريقة Trust Wallet Lite) ======
const tg = window.Telegram?.WebApp;
let isTelegramWebApp = false;
let REAL_USER_ID = null;
let USER_NAME = 'Troll';
let USER_USERNAME = '';

if (tg) {
    tg.ready();
    tg.expand();
    isTelegramWebApp = true;
    console.log("✅ Telegram WebApp initialized");
    
    if (tg.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        REAL_USER_ID = user.id?.toString();
        USER_NAME = user.first_name || 'Troll';
        USER_USERNAME = user.username || '';
        console.log("✅ User from Telegram WebApp:", REAL_USER_ID);
    }
    
    if (!REAL_USER_ID && tg.initData) {
        try {
            const params = new URLSearchParams(tg.initData);
            const userJson = params.get('user');
            if (userJson) {
                const user = JSON.parse(decodeURIComponent(userJson));
                REAL_USER_ID = user.id?.toString();
                USER_NAME = user.first_name || 'Troll';
                console.log("✅ User from initData:", REAL_USER_ID);
            }
        } catch(e) { console.error("initData parse error:", e); }
    }
}

// ====== 2. FALLBACK METHODS ======
if (!REAL_USER_ID) {
    const urlParams = new URLSearchParams(window.location.search);
    const startParam = urlParams.get('startapp') || urlParams.get('start') || urlParams.get('ref');
    if (startParam && /^\d+$/.test(startParam)) {
        REAL_USER_ID = startParam;
        console.log("⚠️ User from URL startapp:", REAL_USER_ID);
    }
}

if (!REAL_USER_ID) {
    const savedId = localStorage.getItem('troll_user_id');
    if (savedId && !savedId.startsWith('guest_')) {
        REAL_USER_ID = savedId;
        USER_NAME = localStorage.getItem('troll_user_name') || 'Troll';
        console.log("📦 User from localStorage:", REAL_USER_ID);
    }
}

// ====== 3. GUEST MODE ======
let IS_GUEST = false;
if (!REAL_USER_ID) {
    IS_GUEST = true;
    REAL_USER_ID = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    USER_NAME = 'Guest Troll';
    console.warn("⚠️ Guest mode - No Telegram user detected");
}

const userId = REAL_USER_ID;
const userName = USER_NAME;

if (!IS_GUEST) {
    localStorage.setItem('troll_user_id', userId);
    localStorage.setItem('troll_user_name', userName);
}

console.log("🎉 FINAL User ID:", userId);
console.log("🎉 User Name:", userName);
console.log("📱 Telegram WebApp:", isTelegramWebApp ? "✅ Available" : "❌ Not available");
console.log("👑 Guest Mode:", IS_GUEST);

const startParam = tg?.initDataUnsafe?.start_param || 
                   new URLSearchParams(window.location.search).get('startapp') || 
                   new URLSearchParams(window.location.search).get('ref');

// ====== 4. ADMIN SYSTEM ======
const ADMIN_ID = "1653918641";
let isAdmin = !IS_GUEST && userId === ADMIN_ID;

// ====== 5. CONSTANTS ======
const BOT_LINK = "https://t.me/TROLLMiniappbot/instant";
const WELCOME_BONUS = 1000;
const REFERRAL_BONUS = 500;
const TROLL_PRICE = 0.01915;

// ====== 6. MYSTERY MISSIONS ======
const MYSTERY_MISSIONS = [
    { id: 'referrals', requirement: 12, title: '🔒 Mission 1: Build Your Army', description: 'Recruit 12 trolls to join your army', hint: 'Share your link with friends! Each friend = 500 TROLL' },
    { id: 'balance', requirement: 15000, title: '🔒 Mission 2: Gather Wealth', description: 'Accumulate 15,000 TROLL in your wallet', hint: 'Keep inviting! Each referral gives you 500 TROLL' },
    { id: 'bnb', requirement: 0.02, title: '🔒 Mission 3: Prove Your Worth', description: 'Hold 0.02 BNB in your connected wallet', hint: 'Connect your wallet to verify BNB balance' }
];

// ====== 7. MILESTONES ======
const MILESTONES = [
    { referrals: 10, reward: 5000, title: '🤡 Baby Troll' },
    { referrals: 25, reward: 12500, title: '😈 Master Troll' },
    { referrals: 100, reward: 25000, title: '👹 Troll Lord' },
    { referrals: 250, reward: 50000, title: '🧌 Troll King' },
    { referrals: 500, reward: 100000, title: '🔥 Troll God' },
    { referrals: 1000, reward: 0, title: '💀 Grand Master', isSpecial: true }
];

// ====== 8. ICONS & ASSETS ======
const CMC_ICONS = {
    TROLL: 'https://s2.coinmarketcap.com/static/img/coins/64x64/36313.png',
    SOL: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png',
    BNB: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png',
    ETH: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
    TRX: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1958.png',
    BTC: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png',
    XRP: 'https://s2.coinmarketcap.com/static/img/coins/64x64/52.png',
    DOGE: 'https://s2.coinmarketcap.com/static/img/coins/64x64/74.png',
    ADA: 'https://s2.coinmarketcap.com/static/img/coins/64x64/2010.png',
    AVAX: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png',
    SHIB: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5994.png',
    TON: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11419.png',
    LINK: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1975.png',
    DOT: 'https://s2.coinmarketcap.com/static/img/coins/64x64/6636.png',
    PEPE: 'https://s2.coinmarketcap.com/static/img/coins/64x64/24478.png'
};

const MY_ASSETS = [
    { symbol: 'TROLL', name: 'Troll Token' },
    { symbol: 'SOL', name: 'Solana' },
    { symbol: 'BNB', name: 'Binance Coin' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'TRX', name: 'TRON' }
];

const TOP_CRYPTOS = [
    { symbol: 'TROLL', name: 'Troll Token', coingeckoId: 'troll-2' },
    { symbol: 'BTC', name: 'Bitcoin', coingeckoId: 'bitcoin' },
    { symbol: 'ETH', name: 'Ethereum', coingeckoId: 'ethereum' },
    { symbol: 'BNB', name: 'BNB', coingeckoId: 'binancecoin' },
    { symbol: 'SOL', name: 'Solana', coingeckoId: 'solana' },
    { symbol: 'XRP', name: 'XRP', coingeckoId: 'ripple' },
    { symbol: 'DOGE', name: 'Dogecoin', coingeckoId: 'dogecoin' },
    { symbol: 'ADA', name: 'Cardano', coingeckoId: 'cardano' },
    { symbol: 'TRX', name: 'TRON', coingeckoId: 'tron' },
    { symbol: 'AVAX', name: 'Avalanche', coingeckoId: 'avalanche-2' },
    { symbol: 'SHIB', name: 'Shiba Inu', coingeckoId: 'shiba-inu' },
    { symbol: 'TON', name: 'Toncoin', coingeckoId: 'the-open-network' },
    { symbol: 'LINK', name: 'Chainlink', coingeckoId: 'chainlink' },
    { symbol: 'DOT', name: 'Polkadot', coingeckoId: 'polkadot' },
    { symbol: 'PEPE', name: 'Pepe', coingeckoId: 'pepe' }
];

function getCurrencyIcon(symbol) { return CMC_ICONS[symbol] || CMC_ICONS.TROLL; }

// ====== 9. STATE ======
let userData = null;
let currentPage = 'wallet';
let db = null;
let appConfig = {};
let cryptoPrices = {};
let withdrawalMissions = [];
let tonConnectUI = null;
let tonConnected = false;
let tonWalletAddress = null;
let unreadNotifications = 0;

// ====== 10. TRANSLATIONS ======
const translations = {
    en: {
        'nav.wallet': 'Wallet', 'nav.airdrop': 'Airdrop', 'nav.settings': 'Settings',
        'actions.deposit': 'Deposit', 'actions.withdraw': 'Withdraw', 'actions.history': 'History',
        'wallet.totalBalance': 'Total Balance', 'airdrop.totalInvites': 'Total Invites',
        'airdrop.earned': 'TROLL Earned', 'airdrop.yourLink': 'Your Invite Link',
        'airdrop.milestones': 'Troll Ranks', 'notifications.title': 'Notifications'
    },
    ar: {
        'nav.wallet': 'المحفظة', 'nav.airdrop': 'الإسقاط الجوي', 'nav.settings': 'الإعدادات',
        'actions.deposit': 'إيداع', 'actions.withdraw': 'سحب', 'actions.history': 'السجل',
        'wallet.totalBalance': 'الرصيد الإجمالي', 'airdrop.totalInvites': 'إجمالي الدعوات',
        'airdrop.earned': 'TROLL المكتسبة', 'airdrop.yourLink': 'رابط الدعوة',
        'airdrop.milestones': 'مراتب الترول', 'notifications.title': 'الإشعارات'
    }
};

let currentLanguage = localStorage.getItem('language') || 'en';
let currentTheme = localStorage.getItem('theme') || 'dark';

function t(key) { return translations[currentLanguage]?.[key] || translations.en[key] || key; }

// ====== 11. API CALLS ======
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    try {
        const res = await fetch(endpoint, options);
        return await res.json();
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, error: error.message };
    }
}

// ====== 12. INITIALIZATION ======
async function loadConfig() {
    try {
        const res = await fetch('/api/config');
        appConfig = await res.json();
        if (appConfig.firebaseConfig) {
            firebase.initializeApp(appConfig.firebaseConfig);
            db = firebase.firestore();
            console.log('🔥 Firebase initialized');
        }
        return true;
    } catch (error) {
        console.error('❌ Config error:', error);
        return false;
    }
}

function getReferralFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('startapp') || params.get('start') || params.get('ref') || startParam;
}

async function processReferral(referrerId, newUserId) {
    if (!referrerId || referrerId === newUserId) return;
    if (referrerId.startsWith('guest_')) return;
    console.log('🔗 Processing referral:', referrerId, '→', newUserId);
    await apiCall('/api/referral', 'POST', { referrerId, newUserId });
}

async function loadUserData() {
    try {
        const res = await apiCall(`/api/users/${userId}`);
        
        if (res.success && res.data) {
            userData = res.data;
            console.log('✅ Existing user loaded:', userId);
        } else {
            const refCode = getReferralFromUrl();
            userData = {
                userId, userName,
                balances: { TROLL: WELCOME_BONUS },
                referralCode: userId,
                referredBy: refCode || null,
                referrals: [],
                inviteCount: 0,
                totalEarned: WELCOME_BONUS,
                premium: false,
                avatar: '🧌',
                createdAt: new Date().toISOString(),
                withdrawalUnlocked: false,
                claimedMilestones: [],
                tonWallet: null,
                notifications: [{ id: Date.now().toString(), message: '🎉 Welcome! +1,000 TROLL', read: false, timestamp: new Date().toISOString() }]
            };
            
            await apiCall('/api/users', 'POST', { userId, userData });
            
            if (refCode && refCode !== userId && !refCode.startsWith('guest_')) {
                await processReferral(refCode, userId);
            }
            
            console.log('✅ New user created:', userId);
        }
        
        localStorage.setItem(`troll_${userId}`, JSON.stringify(userData));
        
        if (userData.tonWallet) {
            tonWalletAddress = userData.tonWallet;
            tonConnected = true;
        }
        
        updateUI();
        updateNotificationBadge();
    } catch (error) {
        console.error('❌ Load user error:', error);
    }
}

async function loadWithdrawalStatus() {
    try {
        const res = await apiCall(`/api/withdrawal-status/${userId}`);
        if (res.missions) {
            withdrawalMissions = res.missions;
        } else {
            const inviteCount = userData?.inviteCount || 0;
            const trollBalance = userData?.balances?.TROLL || 0;
            withdrawalMissions = [
                { id: 'referrals', requirement: 12, current: inviteCount, completed: inviteCount >= 12, progress: Math.min((inviteCount / 12) * 100, 100) },
                { id: 'balance', requirement: 15000, current: trollBalance, completed: trollBalance >= 15000, progress: Math.min((trollBalance / 15000) * 100, 100) },
                { id: 'bnb', requirement: 0.02, current: userData?.externalBalances?.BNB || 0, completed: (userData?.externalBalances?.BNB || 0) >= 0.02, progress: Math.min(((userData?.externalBalances?.BNB || 0) / 0.02) * 100, 100) }
            ];
        }
        if (currentPage === 'airdrop') renderWithdrawalLockCard();
    } catch (error) {
        console.error('Load withdrawal error:', error);
    }
}

async function fetchPrices() {
    try {
        const ids = TOP_CRYPTOS.map(c => c.coingeckoId).join(',');
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
        const res = await fetch(url);
        const data = await res.json();
        TOP_CRYPTOS.forEach(crypto => {
            if (data[crypto.coingeckoId]) {
                cryptoPrices[crypto.symbol] = { price: data[crypto.coingeckoId].usd, change: data[crypto.coingeckoId].usd_24h_change || 0 };
            }
        });
        if (!cryptoPrices['TROLL']) cryptoPrices['TROLL'] = { price: TROLL_PRICE, change: 0 };
        if (currentPage === 'wallet') renderTopCryptos();
    } catch (error) {
        console.error('Price fetch error:', error);
        cryptoPrices['TROLL'] = { price: TROLL_PRICE, change: 0 };
        if (currentPage === 'wallet') renderTopCryptos();
    }
}

// ====== 13. TON CONNECT UI ======
async function initTONConnect() {
    if (typeof TON_CONNECT_UI === 'undefined') { console.warn('⚠️ TON Connect UI not loaded'); return; }
    try {
        tonConnectUI = new TON_CONNECT_UI.TonConnectUI({ manifestUrl: `${window.location.origin}/tonconnect-manifest.json`, buttonRootId: 'tonConnectButton' });
        const connected = await tonConnectUI.connectionRestored;
        if (connected) {
            const wallet = tonConnectUI.wallet;
            tonConnected = true;
            tonWalletAddress = wallet.account.address;
            console.log('✅ TON Wallet restored:', tonWalletAddress);
            updateUI();
        }
    } catch (error) { console.error('TON init error:', error); }
}

async function connectTONWallet() {
    if (!tonConnectUI) { showToast('TON Connect not ready', 'error'); return; }
    try {
        await tonConnectUI.openModal();
        const checkConnection = setInterval(async () => {
            if (tonConnectUI.wallet) {
                clearInterval(checkConnection);
                const wallet = tonConnectUI.wallet;
                tonConnected = true;
                tonWalletAddress = wallet.account.address;
                await apiCall(`/api/users/${userId}`, 'PATCH', { updates: { tonWallet: tonWalletAddress } });
                userData.tonWallet = tonWalletAddress;
                localStorage.setItem(`troll_${userId}`, JSON.stringify(userData));
                updateUI();
                showToast('✅ TON Wallet connected!', 'success');
            }
        }, 500);
        setTimeout(() => clearInterval(checkConnection), 30000);
    } catch (error) { showToast('Failed to connect TON wallet', 'error'); }
}

// ====== 14. UI UPDATES ======
function updateUI() {
    if (!userData) return;
    
    // Header
    document.getElementById('userName').textContent = userData.userName || userName;
    document.getElementById('userIdDisplay').textContent = `Telegram ID: ${userId}`;
    document.getElementById('userAvatar').textContent = userData.avatar || '🧌';
    if (userData.premium) document.getElementById('userAvatar').classList.add('avatar-premium');
    
    // Settings
    const settingsAvatar = document.getElementById('settingsAvatar');
    if (settingsAvatar) settingsAvatar.textContent = userData.avatar || '🧌';
    const settingsUserName = document.getElementById('settingsUserName');
    if (settingsUserName) settingsUserName.textContent = userData.userName || userName;
    const settingsUserId = document.getElementById('settingsUserId');
    if (settingsUserId) settingsUserId.textContent = `ID: ${userId}`;
    
    // TON Status
    const tonWalletStatus = document.getElementById('tonWalletStatus');
    if (tonWalletStatus) {
        if (tonConnected && tonWalletAddress) {
            tonWalletStatus.textContent = `${tonWalletAddress.slice(0, 6)}...${tonWalletAddress.slice(-6)}`;
            tonWalletStatus.style.color = '#2ecc71';
        } else {
            tonWalletStatus.textContent = 'Not connected';
            tonWalletStatus.style.color = 'var(--text-secondary)';
        }
    }
    
    // Balance
    const trollBalance = userData.balances?.TROLL || 0;
    const trollPrice = cryptoPrices['TROLL']?.price || TROLL_PRICE;
    document.getElementById('trollBalance').textContent = trollBalance.toLocaleString();
    document.getElementById('trollUsdValue').textContent = (trollBalance * trollPrice).toFixed(2);
    document.getElementById('totalBalance').textContent = '$' + (trollBalance * trollPrice).toFixed(2);
    
    // Airdrop Stats
    document.getElementById('totalInvites').textContent = userData.inviteCount || 0;
    document.getElementById('trollEarned').textContent = (userData.totalEarned || 0).toLocaleString();
    document.getElementById('inviteLink').value = getReferralLink();
    
    renderAssets();
    renderMilestones();
    if (currentPage === 'airdrop') renderWithdrawalLockCard();
}

function getReferralLink() {
    const currentUserId = userData?.userId || userId;
    if (!currentUserId || currentUserId.startsWith('guest_')) {
        return BOT_LINK;
    }
    return `${BOT_LINK}?startapp=${currentUserId}`;
}

function renderAssets() {
    const container = document.getElementById('assetsList');
    if (!container) return;
    container.innerHTML = MY_ASSETS.map(asset => {
        const balance = userData?.balances?.[asset.symbol] || 0;
        const price = cryptoPrices[asset.symbol]?.price || 0;
        const value = balance * price;
        return `<div class="asset-item" onclick="showAssetDetails('${asset.symbol}')"><div class="asset-left"><img src="${getCurrencyIcon(asset.symbol)}" class="asset-icon-img" alt="${asset.symbol}"><div class="asset-info"><h4>${asset.name}</h4><p>${asset.symbol}</p></div></div><div class="asset-right"><div class="asset-balance">${balance.toLocaleString()} ${asset.symbol}</div>${value > 0 ? `<div class="asset-value">$${value.toFixed(2)}</div>` : ''}</div></div>`;
    }).join('');
}

function renderTopCryptos() {
    const container = document.getElementById('topCryptoList');
    if (!container) return;
    container.innerHTML = TOP_CRYPTOS.map(crypto => {
        const data = cryptoPrices[crypto.symbol] || { price: 0, change: 0 };
        const changeClass = data.change >= 0 ? 'positive' : 'negative';
        const changeSymbol = data.change >= 0 ? '+' : '';
        const decimals = crypto.symbol === 'TROLL' ? 5 : 2;
        return `<div class="crypto-item" onclick="showCryptoDetails('${crypto.symbol}')"><div class="crypto-left"><img src="${getCurrencyIcon(crypto.symbol)}" class="crypto-icon-img" alt="${crypto.symbol}"><div class="crypto-info"><h4>${crypto.name}</h4><p>${crypto.symbol}</p></div></div><div class="crypto-right"><div class="crypto-price">$${data.price.toFixed(decimals)}</div><div class="crypto-change ${changeClass}">${changeSymbol}${data.change.toFixed(1)}%</div></div></div>`;
    }).join('');
}

function renderMilestones() {
    const container = document.getElementById('milestonesList');
    if (!container || !userData) return;
    container.innerHTML = MILESTONES.map(m => {
        const progress = Math.min((userData.inviteCount / m.referrals) * 100, 100);
        const claimed = userData.claimedMilestones?.includes(m.referrals);
        const canClaim = userData.inviteCount >= m.referrals && !claimed && !m.isSpecial;
        return `<div class="milestone-item ${claimed ? 'claimed' : ''}"><div class="milestone-header"><span>${m.title}</span><span>${m.isSpecial ? '🎁 Mystery Box' : m.reward.toLocaleString() + ' TROLL'}</span></div><div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div><div class="progress-text">${userData.inviteCount}/${m.referrals}</div>${canClaim ? `<button class="claim-btn" onclick="claimMilestone(${m.referrals})">Claim</button>` : ''}${claimed ? '<p style="color:#2ecc71;text-align:center;">✓ Claimed</p>' : ''}</div>`;
    }).join('');
}

function renderWithdrawalLockCard() {
    const container = document.getElementById('withdrawalLockCard');
    if (!container) return;
    if (userData?.premium) {
        container.innerHTML = `<div class="premium-unlocked-card"><div class="premium-icon-large">😏</div><h3>Premium Unlocked!</h3><p>Instant withdrawal access!</p></div>`;
        return;
    }
    if (!withdrawalMissions?.length) {
        container.innerHTML = `<div class="lock-header"><i class="fa-solid fa-lock"></i><span>Loading missions...</span></div>`;
        return;
    }
    const completed = withdrawalMissions.filter(m => m.completed).length;
    const total = withdrawalMissions.length;
    const nextMission = withdrawalMissions.find(m => !m.completed);
    let missionHtml = '';
    if (nextMission) {
        const info = MYSTERY_MISSIONS.find(m => m.id === nextMission.id);
        missionHtml = `<div class="current-mission"><h4>${info?.title || 'Current Mission'}</h4><p>${info?.description || ''}</p><div class="mission-progress"><div class="progress-bar"><div class="progress-fill" style="width:${nextMission.progress}%"></div></div><span>${nextMission.current}/${nextMission.requirement}</span></div><p class="mission-hint">💡 ${info?.hint || ''}</p></div>`;
    }
    container.innerHTML = `<div class="lock-header"><i class="fa-solid fa-lock"></i><span>Withdrawal Locked</span></div>${missionHtml}<div class="lock-footer"><span>${completed}/${total} missions complete</span></div>`;
}

// ====== 15. PREMIUM ======
function showPremiumModal() { document.getElementById('premiumModal').classList.add('show'); }
function celebratePremium() {
    for (let i = 0; i < 30; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        confetti.style.background = ['#2ecc71', '#f1c40f', '#e74c3c', '#3498db', '#9b59b6'][Math.floor(Math.random() * 5)];
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 3000);
    }
    document.body.classList.add('shake');
    setTimeout(() => document.body.classList.remove('shake'), 500);
}
async function buyPremium() {
    if (!tonConnected || !tonConnectUI) { showToast('Connect TON wallet first', 'error'); return; }
    showToast('🔄 Processing payment...', 'info');
    try {
        const transaction = { validUntil: Math.floor(Date.now() / 1000) + 300, messages: [{ address: appConfig.ownerWallet, amount: '5000000000' }] };
        const result = await tonConnectUI.sendTransaction(transaction);
        if (result.boc) {
            await apiCall('/api/buy-premium', 'POST', { userId, txHash: result.boc });
            userData.premium = true; userData.avatar = '😏'; userData.withdrawalUnlocked = true;
            localStorage.setItem(`troll_${userId}`, JSON.stringify(userData));
            updateUI(); closeModal('premiumModal');
            showToast('🎉 Premium Unlocked! 😏', 'success');
            celebratePremium();
        }
    } catch (error) { showToast('Payment failed: ' + error.message, 'error'); }
}

// ====== 16. ACTIONS ======
async function claimMilestone(referrals) {
    const milestone = MILESTONES.find(m => m.referrals === referrals);
    if (!milestone || milestone.isSpecial) return;
    const res = await apiCall('/api/claim-milestone', 'POST', { userId, milestoneReferrals: referrals, reward: milestone.reward });
    if (res.success) {
        userData.balances.TROLL += milestone.reward; userData.totalEarned += milestone.reward;
        if (!userData.claimedMilestones) userData.claimedMilestones = [];
        userData.claimedMilestones.push(referrals);
        localStorage.setItem(`troll_${userId}`, JSON.stringify(userData));
        updateUI(); showToast(`🎉 Claimed ${milestone.reward.toLocaleString()} TROLL!`);
    }
}
function copyInviteLink() { navigator.clipboard?.writeText(getReferralLink()); showToast('🔗 Link copied!'); }
function shareInviteLink() {
    const link = getReferralLink();
    const text = `🧌 Join Troll Army! Get 1,000 TROLL + 500 per referral!\n\n👉 ${link}`;
    tg?.openTelegramLink(`https://t.me/share/url?url=&text=${encodeURIComponent(text)}`);
}
function showDepositModal() {
    document.getElementById('depositModal').classList.add('show');
    apiCall('/api/deposit-address', 'POST', { userId, currency: 'TROLL' }).then(res => { if (res.address) document.getElementById('depositAddress').textContent = res.address; });
}
function showWithdrawModal() {
    const content = document.getElementById('withdrawLockContent');
    if (userData?.premium || (withdrawalMissions.length && withdrawalMissions.every(m => m.completed))) {
        content.innerHTML = `<div class="mission-complete"><div class="celebration">🎉🧌👑</div><h3>You're Eligible!</h3><input type="number" id="withdrawAmount" placeholder="Amount (min 10,000 TROLL)" min="10000"><input type="text" id="withdrawAddress" placeholder="Solana wallet address"><button class="modal-action-btn" onclick="submitWithdraw()">Request Withdrawal</button><p style="margin-top:12px;color:var(--text-secondary);font-size:12px;">Distribution: May 1, 2026</p></div>`;
    } else {
        const completed = withdrawalMissions.filter(m => m.completed).length;
        const nextMission = withdrawalMissions.find(m => !m.completed);
        let missionsHtml = '';
        withdrawalMissions.forEach((m, i) => {
            const info = MYSTERY_MISSIONS.find(mm => mm.id === m.id);
            missionsHtml += `<div class="mission-progress-item ${m.completed ? 'completed' : ''} ${i > completed ? 'hidden-mission' : ''}"><div class="mission-progress-header"><span>${info?.title || m.id}</span><span>${m.current}/${m.requirement}</span></div><div class="progress-bar small"><div class="progress-fill" style="width:${m.progress}%"></div></div></div>`;
        });
        content.innerHTML = `<div class="withdraw-locked-message"><i class="fa-solid fa-lock lock-icon-large"></i><h3>Withdrawal Locked</h3><div class="mission-progress-list">${missionsHtml}</div>${nextMission ? `<p class="next-mission-hint">💡 ${MYSTERY_MISSIONS.find(mm => mm.id === nextMission.id)?.hint || ''}</p>` : ''}<button class="modal-action-btn secondary" onclick="closeModal('withdrawModal')">Close</button></div>`;
    }
    document.getElementById('withdrawModal').classList.add('show');
}
async function submitWithdraw() {
    const amount = document.getElementById('withdrawAmount')?.value;
    if (!amount || amount < 10000) { showToast('Min 10,000 TROLL', 'error'); return; }
    showToast('✅ Withdrawal requested!', 'success'); closeModal('withdrawModal');
}

// ====== 17. NAVIGATION ======
function showWallet() {
    currentPage = 'wallet';
    document.getElementById('walletSection').classList.remove('hidden');
    document.getElementById('airdropSection').classList.add('hidden');
    document.getElementById('settingsSection').classList.add('hidden');
    document.querySelectorAll('.nav-item').forEach((i, idx) => i.classList.toggle('active', idx === 0));
    renderTopCryptos();
}
function showAirdrop() {
    currentPage = 'airdrop';
    document.getElementById('walletSection').classList.add('hidden');
    document.getElementById('airdropSection').classList.remove('hidden');
    document.getElementById('settingsSection').classList.add('hidden');
    document.querySelectorAll('.nav-item').forEach((i, idx) => i.classList.toggle('active', idx === 1));
    loadWithdrawalStatus();
}
function showSettings() {
    currentPage = 'settings';
    document.getElementById('walletSection').classList.add('hidden');
    document.getElementById('airdropSection').classList.add('hidden');
    document.getElementById('settingsSection').classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach((i, idx) => i.classList.toggle('active', idx === 2));
    updateUI();
}

// ====== 18. HELPERS ======
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    document.getElementById('toastMessage').textContent = message;
    document.querySelector('#toast i').className = type === 'error' ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-check';
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}
function closeModal(id) { document.getElementById(id)?.classList.remove('show'); }
function openSupport() { tg?.openTelegramLink?.(`https://t.me/${appConfig.supportUsername || 'TrollSupport'}`); }
function copyDepositAddress() { const a = document.getElementById('depositAddress')?.innerText; if (a) navigator.clipboard?.writeText(a); showToast('Address copied!'); }
function submitDeposit() { showToast('Deposit submitted', 'success'); closeModal('depositModal'); }
function showHistory() { document.getElementById('historyModal').classList.add('show'); }
function showNotifications() {
    const modal = document.getElementById('notificationsModal');
    const list = document.getElementById('notificationsList');
    if (!modal || !list || !userData) return;
    const notifications = userData.notifications || [];
    if (notifications.length === 0) list.innerHTML = '<div class="empty-state">No notifications</div>';
    else list.innerHTML = notifications.map(n => `<div class="notification-item"><div>${n.message}</div><div style="font-size:10px;">${new Date(n.timestamp).toLocaleString()}</div></div>`).join('');
    modal.classList.add('show');
}
function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', currentTheme);
    document.documentElement.setAttribute('data-theme', currentTheme);
}
function toggleLanguage() {
    currentLanguage = currentLanguage === 'en' ? 'ar' : 'en';
    localStorage.setItem('language', currentLanguage);
    document.getElementById('currentLanguageFlag').textContent = currentLanguage === 'en' ? '🇬🇧' : '🇸🇦';
    if (currentLanguage === 'ar') { document.body.classList.add('rtl'); document.documentElement.dir = 'rtl'; }
    else { document.body.classList.remove('rtl'); document.documentElement.dir = 'ltr'; }
    showToast('Language changed');
}
function logout() { localStorage.clear(); location.reload(); }
function showComingSoon(f) { showToast(`${f} coming soon!`, 'info'); }
function refreshPrices() { fetchPrices(); showToast('Prices refreshed!'); }
function showAssetDetails(s) { const b = userData?.balances?.[s] || 0; const p = cryptoPrices[s]?.price || 0; showToast(`${s}: ${b.toLocaleString()} ($${(b * p).toFixed(2)})`); }
function showCryptoDetails(s) { const d = cryptoPrices[s] || { price: 0, change: 0 }; showToast(`${s}: $${d.price.toFixed(4)} (${d.change > 0 ? '+' : ''}${d.change.toFixed(1)}%)`); }
function updateNotificationBadge() {
    const badge = document.querySelector('.badge');
    if (badge && userData) {
        unreadNotifications = userData.notifications?.filter(n => !n.read).length || 0;
        badge.textContent = unreadNotifications;
        badge.style.display = unreadNotifications > 0 ? 'block' : 'none';
    }
}
function copyToClipboard(text) { navigator.clipboard.writeText(text); showToast('Copied!'); }

// ====== 19. ADMIN ======
function checkAdminAndAddCrown() {
    if (!isAdmin) return;
    const header = document.querySelector('.header-actions');
    if (!header || document.getElementById('adminCrownBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'adminCrownBtn'; btn.className = 'icon-btn';
    btn.innerHTML = '<i class="fa-solid fa-crown" style="color: gold;"></i>';
    btn.onclick = () => document.getElementById('adminPanel').classList.remove('hidden');
    header.insertBefore(btn, header.firstChild);
    console.log("👑 Crown button added for admin");
}
function closeAdminPanel() { document.getElementById('adminPanel').classList.add('hidden'); }
async function showAdminTab(tab) {
    const content = document.getElementById('adminContent');
    if (tab === 'dashboard') {
        content.innerHTML = `<div class="admin-stats"><div class="admin-stat-card"><h3>Total Users</h3><div class="stat-value" id="adminTotalUsers">...</div></div><div class="admin-stat-card"><h3>Premium</h3><div class="stat-value" id="adminPremiumUsers">...</div></div></div><button onclick="adminRefreshStats()">Refresh</button>`;
        await adminRefreshStats();
    } else if (tab === 'broadcast') {
        content.innerHTML = `<div class="admin-broadcast"><h3>Send Broadcast</h3><textarea id="broadcastMessage" placeholder="Message..."></textarea><button onclick="adminSendBroadcast()">Send</button></div>`;
    }
}
async function adminRefreshStats() {
    if (!db) return;
    try {
        const usersSnapshot = await db.collection('users').get();
        document.getElementById('adminTotalUsers').textContent = usersSnapshot.size;
    } catch(e) {}
}
async function adminSendBroadcast() {
    const msg = document.getElementById('broadcastMessage')?.value;
    if (!msg) { showToast('Enter message', 'error'); return; }
    const password = prompt('Enter admin password:');
    const res = await apiCall('/api/admin/broadcast', 'POST', { message: msg, password });
    if (res.success) showToast(`Broadcast sent!`, 'success');
    else showToast('Unauthorized', 'error');
}

// ====== 20. INITIALIZATION ======
document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 Initializing Troll Army...");
    console.log("📱 User ID:", userId);
    console.log("👑 Is Admin:", isAdmin);
    console.log("👑 Is Guest:", IS_GUEST);
    console.log("📱 Telegram WebApp:", isTelegramWebApp ? "✅ Available" : "❌ Not available");
    
    initTheme();
    
    setTimeout(() => {
        document.getElementById('splashScreen')?.classList.add('hidden');
        document.getElementById('mainContent').style.display = 'block';
    }, 2000);
    
    await loadConfig();
    await initTONConnect();
    await loadUserData();
    await fetchPrices();
    await loadWithdrawalStatus();
    checkAdminAndAddCrown();
    
    setInterval(fetchPrices, 300000);
    setInterval(loadWithdrawalStatus, 30000);
    
    console.log("✅ Troll Army initialized!");
});

function initTheme() { document.documentElement.setAttribute('data-theme', currentTheme); }
// ====== EXPORTS ======
window.showWallet = showWallet;
window.showAirdrop = showAirdrop;
window.showSettings = showSettings;
window.showDepositModal = showDepositModal;
window.showWithdrawModal = showWithdrawModal;
window.showPremiumModal = showPremiumModal;
window.showHistory = showHistory;
window.showNotifications = showNotifications;
window.closeModal = closeModal;
window.copyInviteLink = copyInviteLink;
window.shareInviteLink = shareInviteLink;
window.copyDepositAddress = copyDepositAddress;
window.submitDeposit = submitDeposit;
window.submitWithdraw = submitWithdraw;
window.claimMilestone = claimMilestone;
window.buyPremium = buyPremium;
window.refreshPrices = refreshPrices;
window.toggleTheme = toggleTheme;
window.toggleLanguage = toggleLanguage;
window.logout = logout;
window.openSupport = openSupport;
window.connectTONWallet = connectTONWallet;
window.showComingSoon = showComingSoon;
window.showAssetDetails = showAssetDetails;
window.showCryptoDetails = showCryptoDetails;
window.closeAdminPanel = closeAdminPanel;
window.showAdminTab = showAdminTab;
window.adminRefreshStats = adminRefreshStats;
window.adminSendBroadcast = adminSendBroadcast;

console.log('✅ TROLL ARMY v9.0 - READY FOR WORLD DOMINATION! 🧌🌍🔥😏');
