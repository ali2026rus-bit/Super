// ============================================================
// TROLL ARMY - ULTIMATE AIRDROP SYSTEM v8.0 (PRODUCTION READY)
// FEATURES: /instant?startapp= REFERRAL • MYSTERY MISSIONS • TON CONNECT • PREMIUM 😏
// ============================================================

// ====== TELEGRAM WEBAPP INIT ======
const tg = window.Telegram?.WebApp;
let userId = null;
let userName = null;
let realUserId = null;
let isTelegramWebApp = false;

if (tg) {
    tg.ready();
    tg.expand();
    isTelegramWebApp = true;
    console.log('✅ Telegram WebApp initialized');

    if (tg.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        realUserId = user.id;
        userId = user.id.toString();
        userName = user.first_name || 'Troll';
        console.log('✅ User from initDataUnsafe:', userId);
    }

    if (!userId && tg.initData) {
        try {
            const params = new URLSearchParams(tg.initData);
            const userJson = params.get('user');
            if (userJson) {
                const user = JSON.parse(decodeURIComponent(userJson));
                realUserId = user.id;
                userId = user.id.toString();
                userName = user.first_name || 'Troll';
                console.log('✅ User from initData:', userId);
            }
        } catch (e) {
            console.error('initData parse error:', e);
        }
    }
}

if (!userId) {
    console.warn('⚠️ No Telegram user - guest mode');
    const params = new URLSearchParams(window.location.search);
    const startParam = params.get('startapp') || params.get('start') || params.get('ref');
    if (startParam && /^\d+$/.test(startParam)) {
        userId = startParam;
        userName = 'User_' + userId.slice(-4);
    } else {
        userId = localStorage.getItem('troll_user_id');
        if (!userId) {
            userId = 'guest_' + Date.now();
        }
        userName = localStorage.getItem('troll_user_name') || 'Guest Troll';
    }
}

console.log('🎯 FINAL userId:', userId, 'userName:', userName);
localStorage.setItem('troll_user_id', userId);
localStorage.setItem('troll_user_name', userName);

// ====== CONFIGURATION ======
const WELCOME_BONUS = 1000;
const REFERRAL_BONUS = 500;
const TROLL_PRICE_FALLBACK = 0.01915;

const MYSTERY_MISSIONS = [
    {
        id: 'referrals',
        requirement: 12,
        title: '🔒 Mission 1: Build Your Army',
        description: 'Recruit 12 trolls to join your army',
        hint: 'Share your link with friends! Each friend = 500 TROLL'
    },
    {
        id: 'balance',
        requirement: 15000,
        title: '🔒 Mission 2: Gather Wealth',
        description: 'Accumulate 15,000 TROLL in your wallet',
        hint: 'Keep inviting! Each referral gives you 500 TROLL'
    },
    {
        id: 'bnb',
        requirement: 0.02,
        title: '🔒 Mission 3: Prove Your Worth',
        description: 'Hold 0.02 BNB in your connected wallet',
        hint: 'Connect your wallet to verify BNB balance'
    }
];

const MILESTONES = [
    { referrals: 10, reward: 5000, title: '🤡 Baby Troll' },
    { referrals: 25, reward: 12500, title: '😈 Master Troll' },
    { referrals: 100, reward: 25000, title: '👹 Troll Lord' },
    { referrals: 250, reward: 50000, title: '🧌 Troll King' },
    { referrals: 500, reward: 100000, title: '🔥 Troll God' },
    { referrals: 1000, reward: 0, title: '💀 Grand Master', isSpecial: true }
];

const MY_ASSETS = [
    { symbol: 'TROLL', name: 'Troll Token', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/36313.png' },
    { symbol: 'SOL', name: 'Solana', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png' },
    { symbol: 'BNB', name: 'Binance Coin', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png' },
    { symbol: 'ETH', name: 'Ethereum', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png' },
    { symbol: 'TRX', name: 'TRON', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1958.png' }
];

const TOP_CRYPTOS = [
    { symbol: 'TROLL', name: 'Troll Token', coingeckoId: 'troll-2', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/36313.png' },
    { symbol: 'BTC', name: 'Bitcoin', coingeckoId: 'bitcoin', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png' },
    { symbol: 'ETH', name: 'Ethereum', coingeckoId: 'ethereum', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png' },
    { symbol: 'BNB', name: 'BNB', coingeckoId: 'binancecoin', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png' },
    { symbol: 'SOL', name: 'Solana', coingeckoId: 'solana', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png' },
    { symbol: 'XRP', name: 'XRP', coingeckoId: 'ripple', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/52.png' },
    { symbol: 'DOGE', name: 'Dogecoin', coingeckoId: 'dogecoin', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/74.png' },
    { symbol: 'ADA', name: 'Cardano', coingeckoId: 'cardano', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/2010.png' },
    { symbol: 'TRX', name: 'TRON', coingeckoId: 'tron', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1958.png' },
    { symbol: 'AVAX', name: 'Avalanche', coingeckoId: 'avalanche-2', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png' },
    { symbol: 'SHIB', name: 'Shiba Inu', coingeckoId: 'shiba-inu', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5994.png' },
    { symbol: 'TON', name: 'Toncoin', coingeckoId: 'the-open-network', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11419.png' },
    { symbol: 'LINK', name: 'Chainlink', coingeckoId: 'chainlink', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1975.png' },
    { symbol: 'DOT', name: 'Polkadot', coingeckoId: 'polkadot', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/6636.png' },
    { symbol: 'PEPE', name: 'Pepe', coingeckoId: 'pepe', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/24478.png' }
];

// ====== STATE ======
let userData = null;
let currentPage = 'wallet';
let db = null;
let appConfig = {};
let cryptoPrices = {};
let withdrawalMissions = [];
let tonConnect = null;
let tonConnected = false;
let tonWalletAddress = null;

// ====== API CALLS ======
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method: method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    try {
        const res = await fetch(endpoint, options);
        return await res.json();
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, error: error.message };
    }
}

// ====== INITIALIZATION ======
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
    return params.get('startapp') || params.get('start') || params.get('ref');
}

async function processReferral(referrerId, newUserId) {
    if (!referrerId || referrerId === newUserId) {
        return;
    }
    if (referrerId.startsWith('guest_')) {
        return;
    }
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
                userId: userId,
                userName: userName,
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
                claimedMilestones: []
            };
            await apiCall('/api/users', 'POST', { userId: userId, userData: userData });
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
    } catch (error) {
        console.error('❌ Load user error:', error);
    }
}

async function loadWithdrawalStatus() {
    try {
        const res = await apiCall(`/api/withdrawal-status/${userId}`);
        console.log('📊 Withdrawal status:', res);
        if (res.missions) {
            withdrawalMissions = res.missions;
        } else {
            withdrawalMissions = [
                { id: 'referrals', requirement: 12, current: userData?.inviteCount || 0, completed: (userData?.inviteCount || 0) >= 12, progress: Math.min(((userData?.inviteCount || 0) / 12) * 100, 100) },
                { id: 'balance', requirement: 15000, current: userData?.balances?.TROLL || 0, completed: (userData?.balances?.TROLL || 0) >= 15000, progress: Math.min(((userData?.balances?.TROLL || 0) / 15000) * 100, 100) },
                { id: 'bnb', requirement: 0.02, current: userData?.externalBalances?.BNB || 0, completed: (userData?.externalBalances?.BNB || 0) >= 0.02, progress: Math.min(((userData?.externalBalances?.BNB || 0) / 0.02) * 100, 100) }
            ];
        }
        if (currentPage === 'airdrop') {
            renderWithdrawalLockCard();
        }
    } catch (error) {
        console.error('Load withdrawal error:', error);
        withdrawalMissions = [
            { id: 'referrals', requirement: 12, current: userData?.inviteCount || 0, completed: false, progress: 0 },
            { id: 'balance', requirement: 15000, current: userData?.balances?.TROLL || 0, completed: false, progress: 0 },
            { id: 'bnb', requirement: 0.02, current: 0, completed: false, progress: 0 }
        ];
        renderWithdrawalLockCard();
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
                cryptoPrices[crypto.symbol] = {
                    price: data[crypto.coingeckoId].usd,
                    change: data[crypto.coingeckoId].usd_24h_change || 0
                };
            }
        });
        if (currentPage === 'wallet') {
            renderTopCryptos();
        }
    } catch (error) {
        console.error('Price fetch error:', error);
    }
}

// ====== UI UPDATES ======
function updateUI() {
    if (!userData) {
        return;
    }
    document.getElementById('userName').textContent = userData.userName || userName;
    document.getElementById('userIdDisplay').textContent = `Telegram ID: ${realUserId || userId}`;
    document.getElementById('userAvatar').textContent = userData.avatar || '🧌';
    if (userData.premium) {
        document.getElementById('userAvatar').classList.add('avatar-premium');
    }
    const settingsAvatar = document.getElementById('settingsAvatar');
    if (settingsAvatar) {
        settingsAvatar.textContent = userData.avatar || '🧌';
    }
    const settingsUserName = document.getElementById('settingsUserName');
    if (settingsUserName) {
        settingsUserName.textContent = userData.userName || userName;
    }
    const settingsUserId = document.getElementById('settingsUserId');
    if (settingsUserId) {
        settingsUserId.textContent = `ID: ${realUserId || userId}`;
    }
    const tonWalletStatus = document.getElementById('tonWalletStatus');
    if (tonWalletStatus) {
        if (tonConnected && tonWalletAddress) {
            tonWalletStatus.textContent = `${tonWalletAddress.slice(0, 8)}...${tonWalletAddress.slice(-8)}`;
            tonWalletStatus.style.color = '#2ecc71';
        } else {
            tonWalletStatus.textContent = 'Not connected';
            tonWalletStatus.style.color = 'var(--text-secondary)';
        }
    }
    const trollBalance = userData.balances?.TROLL || 0;
    const trollPrice = cryptoPrices['TROLL']?.price || TROLL_PRICE_FALLBACK;
    document.getElementById('trollBalance').textContent = trollBalance.toLocaleString();
    document.getElementById('trollUsdValue').textContent = (trollBalance * trollPrice).toFixed(2);
    document.getElementById('totalBalance').textContent = '$' + (trollBalance * trollPrice).toFixed(2);
    document.getElementById('totalInvites').textContent = userData.inviteCount || 0;
    document.getElementById('trollEarned').textContent = (userData.totalEarned || 0).toLocaleString();
    document.getElementById('inviteLink').value = getReferralLink();
    renderAssets();
    renderMilestones();
    if (currentPage === 'airdrop') {
        renderWithdrawalLockCard();
    }
}

function getReferralLink() {
    const realId = realUserId || userId;
    if (realId.startsWith('guest_')) {
        return 'https://t.me/TROLLMiniappbot/instant';
    }
    return `https://t.me/TROLLMiniappbot/instant?startapp=${realId}`;
}

function renderAssets() {
    const container = document.getElementById('assetsList');
    if (!container) {
        return;
    }
    container.innerHTML = MY_ASSETS.map(asset => {
        const balance = userData?.balances?.[asset.symbol] || 0;
        const price = cryptoPrices[asset.symbol]?.price || 0;
        const value = balance * price;
        return `
            <div class="asset-item" onclick="showAssetDetails('${asset.symbol}')">
                <div class="asset-left">
                    <img src="${asset.icon}" class="asset-icon-img" alt="${asset.symbol}">
                    <div class="asset-info">
                        <h4>${asset.name}</h4>
                        <p>${asset.symbol}</p>
                    </div>
                </div>
                <div class="asset-right">
                    <div class="asset-balance">${balance.toLocaleString()} ${asset.symbol}</div>
                    ${value > 0 ? `<div class="asset-value">$${value.toFixed(2)}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function renderTopCryptos() {
    const container = document.getElementById('topCryptoList');
    if (!container) {
        return;
    }
    container.innerHTML = TOP_CRYPTOS.map(crypto => {
        const data = cryptoPrices[crypto.symbol] || { price: 0, change: 0 };
        const changeClass = data.change >= 0 ? 'positive' : 'negative';
        const changeSymbol = data.change >= 0 ? '+' : '';
        const decimals = crypto.symbol === 'TROLL' ? 5 : 2;
        return `
            <div class="crypto-item" onclick="showCryptoDetails('${crypto.symbol}')">
                <div class="crypto-left">
                    <img src="${crypto.icon}" class="crypto-icon-img" alt="${crypto.symbol}">
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

function renderMilestones() {
    const container = document.getElementById('milestonesList');
    if (!container || !userData) {
        return;
    }
    container.innerHTML = MILESTONES.map(m => {
        const progress = Math.min((userData.inviteCount / m.referrals) * 100, 100);
        const claimed = userData.claimedMilestones?.includes(m.referrals);
        const canClaim = userData.inviteCount >= m.referrals && !claimed && !m.isSpecial;
        return `
            <div class="milestone-item ${claimed ? 'claimed' : ''}">
                <div class="milestone-header">
                    <span>${m.title}</span>
                    <span>${m.isSpecial ? '🎁 Mystery Box' : m.reward.toLocaleString() + ' TROLL'}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width:${progress}%"></div>
                </div>
                <div class="progress-text">${userData.inviteCount}/${m.referrals}</div>
                ${canClaim ? `<button class="claim-btn" onclick="claimMilestone(${m.referrals})">Claim</button>` : ''}
                ${claimed ? '<p style="color:#2ecc71;text-align:center;">✓ Claimed</p>' : ''}
            </div>
        `;
    }).join('');
}

function renderWithdrawalLockCard() {
    const container = document.getElementById('withdrawalLockCard');
    if (!container) {
        return;
    }
    if (userData?.premium) {
        container.innerHTML = `
            <div class="premium-unlocked-card">
                <div class="premium-icon-large">😏</div>
                <h3>Premium Unlocked!</h3>
                <p>Instant withdrawal access!</p>
            </div>
        `;
        return;
    }
    if (!withdrawalMissions || !withdrawalMissions.length) {
        container.innerHTML = `
            <div class="lock-header">
                <i class="fa-solid fa-lock"></i>
                <span>Loading missions...</span>
            </div>
        `;
        return;
    }
    const completed = withdrawalMissions.filter(m => m.completed).length;
    const total = withdrawalMissions.length;
    const nextMission = withdrawalMissions.find(m => !m.completed);
    let missionHtml = '';
    if (nextMission) {
        const info = MYSTERY_MISSIONS.find(m => m.id === nextMission.id);
        missionHtml = `
            <div class="current-mission">
                <h4>${info?.title || 'Current Mission'}</h4>
                <p>${info?.description || ''}</p>
                <div class="mission-progress">
                    <div class="progress-bar"><div class="progress-fill" style="width:${nextMission.progress}%"></div></div>
                    <span>${nextMission.current}/${nextMission.requirement}</span>
                </div>
                <p class="mission-hint">💡 ${info?.hint || ''}</p>
            </div>
        `;
    }
    container.innerHTML = `
        <div class="lock-header"><i class="fa-solid fa-lock"></i><span>Withdrawal Locked</span></div>
        ${missionHtml}
        <div class="lock-footer"><span>${completed}/${total} missions complete</span></div>
    `;
}

// ====== TON CONNECT ======
async function initTONConnect() {
    if (typeof TON_CONNECT === 'undefined') {
        return;
    }
    tonConnect = new TON_CONNECT.TonConnect({
        manifestUrl: `${window.location.origin}/tonconnect-manifest.json`
    });
    try {
        const connected = await tonConnect.restoreConnection();
        if (connected) {
            tonConnected = true;
            tonWalletAddress = tonConnect.wallet.account.address;
            updateUI();
        }
    } catch (error) {
        console.error('TON restore error:', error);
    }
}

async function connectTONWallet() {
    if (!tonConnect) {
        showToast('TON Connect not ready', 'error');
        return;
    }
    try {
        const wallets = await tonConnect.getWallets();
        const telegramWallet = wallets.find(w => w.name === 'Telegram Wallet');
        if (telegramWallet) {
            await tonConnect.connect(telegramWallet);
            tonConnected = true;
            tonWalletAddress = tonConnect.wallet.account.address;
            await apiCall(`/api/users/${userId}`, 'PATCH', {
                updates: { tonWallet: tonWalletAddress }
            });
            userData.tonWallet = tonWalletAddress;
            localStorage.setItem(`troll_${userId}`, JSON.stringify(userData));
            updateUI();
            showToast('✅ TON Wallet connected!', 'success');
        } else {
            showToast('Telegram Wallet not found', 'error');
        }
    } catch (error) {
        showToast('Failed to connect', 'error');
    }
}

// ====== PREMIUM ======
function showPremiumModal() {
    document.getElementById('premiumModal').classList.add('show');
}

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
}

async function buyPremium() {
    if (!tonConnected || !tonConnect) {
        showToast('Connect TON wallet first', 'error');
        return;
    }
    showToast('🔄 Processing payment...', 'info');
    try {
        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 300,
            messages: [{
                address: appConfig.ownerWallet,
                amount: '5000000000'
            }]
        };
        const result = await tonConnect.sendTransaction(transaction);
        if (result.boc) {
            await apiCall('/api/buy-premium', 'POST', {
                userId: userId,
                txHash: result.boc
            });
            userData.premium = true;
            userData.avatar = '😏';
            userData.withdrawalUnlocked = true;
            localStorage.setItem(`troll_${userId}`, JSON.stringify(userData));
            updateUI();
            closeModal('premiumModal');
            showToast('🎉 Premium Unlocked! 😏', 'success');
            celebratePremium();
        }
    } catch (error) {
        showToast('Payment failed: ' + error.message, 'error');
    }
}

// ====== ACTIONS ======
async function claimMilestone(referrals) {
    const milestone = MILESTONES.find(m => m.referrals === referrals);
    if (!milestone || milestone.isSpecial) {
        return;
    }
    const res = await apiCall('/api/claim-milestone', 'POST', {
        userId: userId,
        milestoneReferrals: referrals,
        reward: milestone.reward
    });
    if (res.success) {
        userData.balances.TROLL += milestone.reward;
        userData.totalEarned += milestone.reward;
        if (!userData.claimedMilestones) {
            userData.claimedMilestones = [];
        }
        userData.claimedMilestones.push(referrals);
        localStorage.setItem(`troll_${userId}`, JSON.stringify(userData));
        updateUI();
        showToast(`🎉 Claimed ${milestone.reward.toLocaleString()} TROLL!`);
    }
}

function copyInviteLink() {
    const link = getReferralLink();
    navigator.clipboard?.writeText(link);
    showToast('🔗 Link copied!');
}

function shareInviteLink() {
    const link = getReferralLink();
    const text = `🧌 Join Troll Army! Get 1,000 TROLL + 500 per referral!\n\n👉 ${link}`;
    if (tg) {
        tg.openTelegramLink(`https://t.me/share/url?url=&text=${encodeURIComponent(text)}`);
    } else {
        window.open(`https://t.me/share/url?url=&text=${encodeURIComponent(text)}`, '_blank');
    }
}

function showDepositModal() {
    document.getElementById('depositModal').classList.add('show');
    apiCall('/api/deposit-address', 'POST', { userId: userId, currency: 'TROLL' }).then(res => {
        if (res.address) {
            document.getElementById('depositAddress').textContent = res.address;
        }
    });
}

function showWithdrawModal() {
    const content = document.getElementById('withdrawLockContent');
    if (userData?.premium || (withdrawalMissions.length && withdrawalMissions.every(m => m.completed))) {
        content.innerHTML = `
            <div class="mission-complete">
                <div class="celebration">🎉🧌👑</div>
                <h3>You're Eligible!</h3>
                <input type="number" id="withdrawAmount" placeholder="Amount (min 10,000 TROLL)" min="10000">
                <input type="text" id="withdrawAddress" placeholder="Solana wallet address">
                <button class="modal-action-btn" onclick="submitWithdraw()">Request Withdrawal</button>
            </div>
        `;
    } else {
        const completed = withdrawalMissions.filter(m => m.completed).length;
        const nextMission = withdrawalMissions.find(m => !m.completed);
        let missionsHtml = '';
        withdrawalMissions.forEach((m, i) => {
            const info = MYSTERY_MISSIONS.find(mm => mm.id === m.id);
            missionsHtml += `
                <div class="mission-progress-item ${m.completed ? 'completed' : ''} ${i > completed ? 'hidden-mission' : ''}">
                    <div class="mission-progress-header">
                        <span>${info?.title || m.id}</span>
                        <span>${m.current}/${m.requirement}</span>
                    </div>
                    <div class="progress-bar small"><div class="progress-fill" style="width:${m.progress}%"></div></div>
                </div>
            `;
        });
        content.innerHTML = `
            <div class="withdraw-locked-message">
                <i class="fa-solid fa-lock lock-icon-large"></i>
                <h3>Withdrawal Locked</h3>
                <div class="mission-progress-list">${missionsHtml}</div>
                ${nextMission ? `<p class="next-mission-hint">💡 ${MYSTERY_MISSIONS.find(mm => mm.id === nextMission.id)?.hint || ''}</p>` : ''}
                <button class="modal-action-btn secondary" onclick="closeModal('withdrawModal')">Close</button>
            </div>
        `;
    }
    document.getElementById('withdrawModal').classList.add('show');
}

async function submitWithdraw() {
    const amount = document.getElementById('withdrawAmount')?.value;
    if (!amount || amount < 10000) {
        showToast('Min 10,000 TROLL', 'error');
        return;
    }
    showToast('✅ Withdrawal requested!', 'success');
    closeModal('withdrawModal');
}

// ====== NAVIGATION ======
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

// ====== HELPERS ======
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    document.getElementById('toastMessage').textContent = message;
    const icon = toast.querySelector('i');
    icon.className = type === 'error' ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-check';
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function closeModal(id) {
    document.getElementById(id).classList.remove('show');
}

function openSupport() {
    const username = appConfig.supportUsername || 'TrollSupport';
    tg?.openTelegramLink?.(`https://t.me/${username}`);
}

function copyDepositAddress() {
    const address = document.getElementById('depositAddress').textContent;
    navigator.clipboard?.writeText(address);
    showToast('Address copied!');
}

function submitDeposit() {
    showToast('Deposit submitted', 'success');
    closeModal('depositModal');
}

function showHistory() {
    document.getElementById('historyModal').classList.add('show');
}

function showNotifications() {
    document.getElementById('notificationsModal').classList.add('show');
}

function toggleTheme() {
    const theme = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'light' : 'dark');
}

function toggleLanguage() {
    showToast('English', 'info');
}

function logout() {
    localStorage.clear();
    location.reload();
}

function showComingSoon(feature) {
    showToast(`${feature} coming soon!`, 'info');
}

function refreshPrices() {
    fetchPrices();
    showToast('Prices refreshed!');
}

function showAssetDetails(symbol) {
    const balance = userData?.balances?.[symbol] || 0;
    const price = cryptoPrices[symbol]?.price || 0;
    showToast(`${symbol}: ${balance.toLocaleString()} ($${(balance * price).toFixed(2)})`);
}

function showCryptoDetails(symbol) {
    const data = cryptoPrices[symbol] || { price: 0, change: 0 };
    const changeSymbol = data.change >= 0 ? '+' : '';
    showToast(`${symbol}: $${data.price.toFixed(4)} (${changeSymbol}${data.change.toFixed(1)}%)`);
}

function checkAdminAndAddCrown() {
    if (userId === appConfig.adminId) {
        const header = document.querySelector('.header-actions');
        const btn = document.createElement('button');
        btn.id = 'adminCrownBtn';
        btn.className = 'icon-btn';
        btn.innerHTML = '<i class="fa-solid fa-crown" style="color: gold;"></i>';
        btn.onclick = function() {
            document.getElementById('adminPanel').classList.remove('hidden');
        };
        header.insertBefore(btn, header.firstChild);
    }
}

function closeAdminPanel() {
    document.getElementById('adminPanel').classList.add('hidden');
}

// ====== INIT ======
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🧌 TROLL ARMY v8.0 - PRODUCTION READY');
    setTimeout(function() {
        document.getElementById('splashScreen').classList.add('hidden');
        document.getElementById('mainContent').style.display = 'block';
    }, 1500);
    await loadConfig();
    await initTONConnect();
    await loadUserData();
    await fetchPrices();
    await loadWithdrawalStatus();
    checkAdminAndAddCrown();
    setInterval(fetchPrices, 300000);
    setInterval(loadWithdrawalStatus, 30000);
});

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

console.log('✅ TROLL ARMY READY! 🧌🔥😏');
