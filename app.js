// ============================================================
// TROLL ARMY - COMPLETE SYSTEM v17.0
// ============================================================
// Telegram WebApp + Firebase + TON Connect + CoinGecko
// 4 مهام غامضة + إحالات + Premium + إيداع/سحب
// ============================================================

// ====== 1. TELEGRAM WEBAPP ======
const tg = window.Telegram?.WebApp;
let isTelegramWebApp = false;
let REAL_USER_ID = null;
let USER_NAME = 'Troll';
let USER_USERNAME = '';

function initTelegramApp() {
    if (!tg) { console.warn("⚠️ Telegram WebApp not available"); return false; }
    tg.ready(); tg.expand();
    isTelegramWebApp = true;
    console.log("✅ Telegram WebApp initialized");
    return true;
}

function extractUserData() {
    if (tg?.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        REAL_USER_ID = user.id?.toString();
        USER_NAME = user.first_name || 'Troll';
        USER_USERNAME = user.username || '';
        return true;
    }
    if (tg?.initData) {
        try {
            const params = new URLSearchParams(tg.initData);
            const userJson = params.get('user');
            if (userJson) {
                const user = JSON.parse(decodeURIComponent(userJson));
                REAL_USER_ID = user.id?.toString();
                USER_NAME = user.first_name || 'Troll';
                USER_USERNAME = user.username || '';
                return true;
            }
        } catch(e) {}
    }
    return false;
}

// ====== 2. CONFIGURATION ======
const WELCOME_BONUS = 1000;
const REFERRAL_BONUS = 500;
let TROLL_PRICE_FALLBACK = 0.01915;
let ADMIN_ID = null;
const BOT_LINK = "https://t.me/TROLLMiniappbot/instant";
let OWNER_WALLET = null;

const MYSTERY_MISSIONS = {
    mission1: { id: 'solana_wallet', title: 'Mission 1: Connect Wallet', description: 'Add your Solana wallet address', hint: 'Go to Settings → Solana Wallet' },
    mission2: { id: 'referral_earnings', title: 'Mission 2: Build Wealth', description: 'Earn 12,500 TROLL from referrals', hint: 'Each referral gives 500 TROLL', required: 12500 },
    mission3: { id: 'new_referrals', title: 'Mission 3: Expand Army', description: 'Get 12 NEW referrals', hint: 'Only new referrals after this mission starts count', required: 12 },
    mission4: { id: 'holdings', title: 'Mission 4: Prove Holdings', description: 'Hold 0.025 BNB or 0.25 SOL', hint: 'Deposit to your in-app wallet', requiredBNB: 0.025, requiredSOL: 0.25 }
};

const MILESTONES = [
    { referrals: 10, reward: 5000, title: '🤡 Baby Troll' },
    { referrals: 25, reward: 12500, title: '😈 Master Troll' },
    { referrals: 100, reward: 25000, title: '👹 Troll Lord' },
    { referrals: 250, reward: 50000, title: '🧌 Troll King' },
    { referrals: 500, reward: 100000, title: '🔥 Troll God' },
    { referrals: 1000, reward: 0, title: '💀 Grand Master', isSpecial: true }
];

const CURRENCY_ICONS = {
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
    { symbol: 'PEPE', name: 'Pepe', coingeckoId: 'pepe' },
    { symbol: 'BONK', name: 'Bonk', coingeckoId: 'bonk' },
    { symbol: 'WIF', name: 'Dogwifhat', coingeckoId: 'dogwifcoin' }
];

// ====== 3. STATE ======
let userData = null;
let currentPage = 'wallet';
let db = null;
let appConfig = {};
let cryptoPrices = {};
let tonConnectUI = null;
let tonConnected = false;
let tonWalletAddress = null;
let currentLanguage = 'en';
let currentTheme = localStorage.getItem('theme') || 'dark';

// ====== 4. API CALLS ======
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    try {
        const res = await fetch(endpoint, options);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (error) {
        console.error('❌ API Error:', error);
        return { success: false, error: error.message };
    }
}

// ====== 5. COINGECKO PRICES ======
async function fetchPrices() {
    try {
        const allCoins = [...TOP_CRYPTOS, ...MEME_COINS];
        const ids = allCoins.map(c => c.coingeckoId).join(',');
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
        const res = await fetch(url);
        const data = await res.json();
        
        allCoins.forEach(crypto => {
            if (data[crypto.coingeckoId]) {
                cryptoPrices[crypto.symbol] = {
                    price: data[crypto.coingeckoId].usd,
                    change: data[crypto.coingeckoId].usd_24h_change || 0
                };
            }
        });
        
        if (!cryptoPrices['TROLL']) {
            cryptoPrices['TROLL'] = { price: TROLL_PRICE_FALLBACK, change: 0 };
        }
        
        if (currentPage === 'wallet') {
            renderTopCryptos();
            renderMemeCoins();
        }
        updateUI();
    } catch (error) {
        console.error('❌ Prices error:', error);
        cryptoPrices['TROLL'] = { price: TROLL_PRICE_FALLBACK, change: 0 };
    }
}

// ====== 6. INITIALIZATION ======
async function loadConfig() {
    try {
        const res = await fetch('/api/config');
        appConfig = await res.json();
        
        if (appConfig.adminId) ADMIN_ID = appConfig.adminId;
        if (appConfig.ownerWallet) OWNER_WALLET = appConfig.ownerWallet;
        if (appConfig.trollPriceFallback) TROLL_PRICE_FALLBACK = appConfig.trollPriceFallback;
        
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

function getReferralFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('startapp') || params.get('start') || params.get('ref');
}

// ====== 7. USER DATA & REFERRAL ======
async function loadUserData() {
    try {
        if (!REAL_USER_ID) return false;
        console.log('📂 Loading user:', REAL_USER_ID);
        
        let res = await apiCall(`/api/users/${REAL_USER_ID}`);
        
        if (res.success && res.data) {
            userData = res.data;
            if (!userData.withdrawalMissions) {
                userData.withdrawalMissions = getDefaultMissions();
                await saveUserData();
            }
        } else {
            const refCode = getReferralFromUrl();
            userData = createNewUserObject(refCode);
            
            const createRes = await apiCall('/api/users', 'POST', { userId: REAL_USER_ID, userData });
            if (createRes.success) {
                if (refCode && refCode !== REAL_USER_ID) {
                    await processReferral(refCode, REAL_USER_ID);
                }
            }
        }
        
        localStorage.setItem(`troll_${REAL_USER_ID}`, JSON.stringify(userData));
        localStorage.setItem('troll_user_id', REAL_USER_ID);
        
        if (userData.tonWallet) {
            tonWalletAddress = userData.tonWallet;
            tonConnected = true;
        }
        
        await updateMissionsProgress();
        updateUI();
        updateNotificationBadge();
        return true;
    } catch (error) {
        console.error('❌ Load user error:', error);
        return false;
    }
}

function createNewUserObject(refCode) {
    return {
        userId: REAL_USER_ID,
        userName: USER_NAME,
        userUsername: USER_USERNAME,
        balances: { TROLL: WELCOME_BONUS, BNB: 0, SOL: 0, ETH: 0, TRON: 0 },
        referralCode: REAL_USER_ID,
        referredBy: refCode || null,
        referrals: [],
        inviteCount: 0,
        referralEarnings: 0,
        totalEarned: WELCOME_BONUS,
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
            message: '🎉 Welcome! +1,000 TROLL',
            read: false,
            timestamp: new Date().toISOString()
        }]
    };
}

function getDefaultMissions() {
    return {
        mission1: { completed: false, revealed: true, walletAddress: null },
        mission2: { completed: false, revealed: false, currentAmount: 0, requiredAmount: 12500 },
        mission3: { completed: false, revealed: false, referralsAtStart: 0, currentNewReferrals: 0, requiredReferrals: 12 },
        mission4: { completed: false, revealed: false, revealDate: null, requiredBNB: 0.025, requiredSOL: 0.25 }
    };
}

async function processReferral(referrerId, newUserId) {
    if (!referrerId || referrerId === newUserId) return;
    await apiCall('/api/referral', 'POST', { referrerId, newUserId });
}

async function saveUserData() {
    await apiCall(`/api/users/${REAL_USER_ID}`, 'PATCH', { 
        updates: { 
            withdrawalMissions: userData.withdrawalMissions,
            withdrawalUnlocked: userData.withdrawalUnlocked,
            settings: userData.settings,
            balances: userData.balances,
            inviteCount: userData.inviteCount,
            referralEarnings: userData.referralEarnings,
            tonWallet: userData.tonWallet
        } 
    });
}

// ====== 8. MYSTERY MISSIONS ======
async function updateMissionsProgress() {
    if (!userData) return;
    const missions = userData.withdrawalMissions;
    let changed = false;
    
    // Mission 1
    if (!missions.mission1.completed && userData.settings?.solanaWallet) {
        missions.mission1.completed = true;
        missions.mission1.walletAddress = userData.settings.solanaWallet;
        if (!missions.mission2.revealed) {
            missions.mission2.revealed = true;
            addNotification('🔓 Mission 2 revealed!');
        }
        changed = true;
    }
    
    // Mission 2
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
    
    // Mission 3
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
    
    // Mission 4 reveal
    if (missions.mission3.completed && !missions.mission4.revealed) {
        if (new Date() >= new Date(missions.mission4.revealDate)) {
            missions.mission4.revealed = true;
            addNotification('🔓 Final mission revealed!');
            changed = true;
        }
    }
    
    // Mission 4 complete
    if (missions.mission4.revealed && !missions.mission4.completed) {
        const bnb = userData.balances?.BNB || 0;
        const sol = userData.balances?.SOL || 0;
        if (bnb >= missions.mission4.requiredBNB || sol >= missions.mission4.requiredSOL) {
            missions.mission4.completed = true;
            changed = true;
        }
    }
    
    // Unlock withdrawal
    const allCompleted = missions.mission1.completed && missions.mission2.completed && missions.mission3.completed && missions.mission4.completed;
    if (allCompleted && !userData.withdrawalUnlocked) {
        userData.withdrawalUnlocked = true;
        addNotification('🎉 WITHDRAWAL UNLOCKED!');
        celebrateUnlock();
        changed = true;
    }
    
    if (changed) await saveUserData();
    if (currentPage === 'airdrop') renderMissionsUI();
}

function addNotification(message) {
    if (!userData.notifications) userData.notifications = [];
    userData.notifications.unshift({ id: Date.now().toString(), message, read: false, timestamp: new Date().toISOString() });
    updateNotificationBadge();
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

// ====== 9. RENDER UI ======
function updateUI() {
    if (!userData) return;
    
    // Header
    document.getElementById('userName').textContent = userData.userName || USER_NAME;
    document.getElementById('userIdDisplay').textContent = `Telegram ID: ${REAL_USER_ID}`;
    const avatarEl = document.getElementById('userAvatar');
    if (avatarEl) {
        avatarEl.textContent = userData.premium ? '😏' : (userData.avatar || '🧌');
        if (userData.premium) avatarEl.classList.add('avatar-premium');
    }
    
    // Settings
    const settingsAvatar = document.getElementById('settingsAvatar');
    const settingsUserName = document.getElementById('settingsUserName');
    const settingsUserId = document.getElementById('settingsUserId');
    const currentSolanaWallet = document.getElementById('currentSolanaWallet');
    
    if (settingsAvatar) settingsAvatar.textContent = userData.premium ? '😏' : (userData.avatar || '🧌');
    if (settingsUserName) settingsUserName.textContent = userData.userName || USER_NAME;
    if (settingsUserId) settingsUserId.textContent = `ID: ${REAL_USER_ID}`;
    if (currentSolanaWallet) {
        const wallet = userData.settings?.solanaWallet;
        currentSolanaWallet.textContent = wallet ? wallet.slice(0, 8) + '...' : 'Not set';
    }
    
    // TON Status
    const tonWalletStatus = document.getElementById('tonWalletStatus');
    if (tonWalletStatus) {
        tonWalletStatus.textContent = tonConnected && tonWalletAddress ? 
            `${tonWalletAddress.slice(0, 6)}...${tonWalletAddress.slice(-6)}` : 'Not connected';
        tonWalletStatus.style.color = tonConnected ? '#2ecc71' : 'var(--text-secondary)';
    }
    
    // Balance with USD value
    const trollBalance = userData.balances?.TROLL || 0;
    const trollPrice = cryptoPrices['TROLL']?.price || TROLL_PRICE_FALLBACK;
    const usdValue = trollBalance * trollPrice;
    
    document.getElementById('trollBalance').textContent = trollBalance.toLocaleString();
    document.getElementById('trollUsdValue').textContent = usdValue.toFixed(2);
    document.getElementById('totalBalance').textContent = '$' + usdValue.toFixed(2);
    
    // Airdrop Stats
    document.getElementById('totalInvites').textContent = userData.inviteCount || 0;
    document.getElementById('trollEarned').textContent = (userData.referralEarnings || 0).toLocaleString();
    document.getElementById('inviteLink').value = getReferralLink();
    
    renderAssets();
    renderMilestones();
    if (currentPage === 'airdrop') renderMissionsUI();
}

function getReferralLink() {
    return `${BOT_LINK}?startapp=${REAL_USER_ID}`;
}

function renderAssets() {
    const container = document.getElementById('assetsList');
    if (!container) return;
    
    const assets = [
        { symbol: 'TROLL', name: 'Troll Token' },
        { symbol: 'SOL', name: 'Solana' },
        { symbol: 'BNB', name: 'Binance Coin' },
        { symbol: 'ETH', name: 'Ethereum' },
        { symbol: 'TRON', name: 'TRON' }
    ];
    
    container.innerHTML = assets.map(asset => {
        const balance = userData?.balances?.[asset.symbol] || 0;
        const price = cryptoPrices[asset.symbol]?.price || 0;
        const value = balance * price;
        const icon = CURRENCY_ICONS[asset.symbol] || CURRENCY_ICONS.TROLL;
        
        return `
            <div class="asset-item" onclick="showAssetDetails('${asset.symbol}')">
                <div class="asset-left">
                    <img src="${icon}" class="asset-icon-img" alt="${asset.symbol}">
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
    if (!container) return;
    
    container.innerHTML = TOP_CRYPTOS.map(crypto => {
        const data = cryptoPrices[crypto.symbol] || { price: 0, change: 0 };
        const changeClass = data.change >= 0 ? 'positive' : 'negative';
        const changeSymbol = data.change >= 0 ? '+' : '';
        const decimals = crypto.symbol === 'TROLL' ? 5 : 2;
        const icon = CURRENCY_ICONS[crypto.symbol] || CURRENCY_ICONS.TROLL;
        
        return `
            <div class="crypto-item" onclick="showCryptoDetails('${crypto.symbol}')">
                <div class="crypto-left">
                    <img src="${icon}" class="crypto-icon-img" alt="${crypto.symbol}">
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
        const data = cryptoPrices[crypto.symbol] || { price: 0, change: 0 };
        const changeClass = data.change >= 0 ? 'positive' : 'negative';
        const changeSymbol = data.change >= 0 ? '+' : '';
        const icon = CURRENCY_ICONS[crypto.symbol] || CURRENCY_ICONS.TROLL;
        
        return `
            <div class="crypto-item" onclick="showCryptoDetails('${crypto.symbol}')">
                <div class="crypto-left">
                    <img src="${icon}" class="crypto-icon-img" alt="${crypto.symbol}">
                    <div class="crypto-info">
                        <h4>${crypto.name}</h4>
                        <p>${crypto.symbol}</p>
                    </div>
                </div>
                <div class="crypto-right">
                    <div class="crypto-price">$${data.price.toFixed(6)}</div>
                    <div class="crypto-change ${changeClass}">${changeSymbol}${data.change.toFixed(1)}%</div>
                </div>
            </div>
        `;
    }).join('');
}

function renderMilestones() {
    const container = document.getElementById('milestonesList');
    if (!container || !userData) return;
    
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

function renderMissionsUI() {
    const container = document.getElementById('withdrawalLockCard');
    if (!container || !userData) return;
    
    const missions = userData.withdrawalMissions;
    
    if (userData.premium) {
        container.innerHTML = `<div class="premium-unlocked-card"><div class="premium-icon-large">😏</div><h3>Premium Unlocked!</h3><p>Instant withdrawal access!</p></div>`;
        return;
    }
    
    let html = `
        <div class="lock-header"><i class="fa-solid fa-${userData.withdrawalUnlocked ? 'unlock' : 'lock'}"></i><span>${userData.withdrawalUnlocked ? '✅ Withdrawal Available!' : '🔒 Withdrawal Locked'}</span></div>
        <div class="missions-list-vertical">
    `;
    
    // Mission 1
    html += `<div class="mission-card ${missions.mission1.completed ? 'completed' : ''}">
        <div class="mission-icon">${missions.mission1.completed ? '✅' : '1️⃣'}</div>
        <div class="mission-content"><h4>${MYSTERY_MISSIONS.mission1.title}</h4><p>${userData.settings?.solanaWallet ? 'Wallet: ' + userData.settings.solanaWallet.slice(0, 8) + '...' : MYSTERY_MISSIONS.mission1.description}</p>
        ${!missions.mission1.completed ? `<button class="mission-action-btn" onclick="showSolanaWalletModal()">Add Wallet</button>` : ''}</div>
    </div>`;
    
    // Mission 2
    if (missions.mission2.revealed) {
        html += `<div class="mission-card ${missions.mission2.completed ? 'completed' : ''}">
            <div class="mission-icon">${missions.mission2.completed ? '✅' : '2️⃣'}</div>
            <div class="mission-content"><h4>${MYSTERY_MISSIONS.mission2.title}</h4><p>${missions.mission2.currentAmount.toLocaleString()} / 12,500 TROLL</p>
            <div class="progress-bar small"><div class="progress-fill" style="width:${(missions.mission2.currentAmount / 12500) * 100}%"></div></div>
            <p class="mission-hint">💡 ${MYSTERY_MISSIONS.mission2.hint}</p></div>
        </div>`;
    } else {
        html += `<div class="mission-card mystery"><div class="mission-icon">❓</div><div class="mission-content"><h4>Mission 2: ???</h4><p>Reveals after Mission 1</p></div></div>`;
    }
    
    // Mission 3
    if (missions.mission3.revealed) {
        html += `<div class="mission-card ${missions.mission3.completed ? 'completed' : ''}">
            <div class="mission-icon">${missions.mission3.completed ? '✅' : '3️⃣'}</div>
            <div class="mission-content"><h4>${MYSTERY_MISSIONS.mission3.title}</h4><p>${missions.mission3.currentNewReferrals} / 12 new referrals</p>
            <div class="progress-bar small"><div class="progress-fill" style="width:${(missions.mission3.currentNewReferrals / 12) * 100}%"></div></div>
            <p class="mission-hint">💡 ${MYSTERY_MISSIONS.mission3.hint}</p></div>
        </div>`;
    } else {
        html += `<div class="mission-card mystery"><div class="mission-icon">❓</div><div class="mission-content"><h4>Mission 3: ???</h4><p>Reveals after Mission 2</p></div></div>`;
    }
    
    // Mission 4
    if (missions.mission4.revealed) {
        const bnb = userData.balances?.BNB || 0;
        const sol = userData.balances?.SOL || 0;
        html += `<div class="mission-card ${missions.mission4.completed ? 'completed' : ''}">
            <div class="mission-icon">${missions.mission4.completed ? '✅' : '4️⃣'}</div>
            <div class="mission-content"><h4>${MYSTERY_MISSIONS.mission4.title}</h4><p>BNB: ${bnb.toFixed(4)} / 0.025 | SOL: ${sol.toFixed(4)} / 0.25</p>
            <p class="mission-hint">💡 ${MYSTERY_MISSIONS.mission4.hint}</p></div>
        </div>`;
    } else if (missions.mission3.completed) {
        const revealDate = new Date(missions.mission4.revealDate);
        const daysLeft = Math.max(0, Math.ceil((revealDate - new Date()) / (1000 * 60 * 60 * 24)));
        html += `<div class="mission-card mystery-timer"><div class="mission-icon">⏳</div><div class="mission-content"><h4>Final Mystery Mission</h4><p>Reveals in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}</p>
            <div class="timer-progress-bar"><div class="timer-fill" style="width:${((20 - daysLeft) / 20) * 100}%"></div></div></div></div>`;
    } else {
        html += `<div class="mission-card mystery"><div class="mission-icon">❓</div><div class="mission-content"><h4>Mission 4: ???</h4><p>Reveals after Mission 3</p></div></div>`;
    }
    
    html += `</div>`;
    container.innerHTML = html;
}

// ====== 10. TON CONNECT ======
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
            updateUI();
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
                updateUI();
                showToast('✅ TON Wallet connected!', 'success');
            }
        }, 500);
        setTimeout(() => clearInterval(checkConnection), 30000);
    } catch (error) { showToast('Failed to connect', 'error'); }
}

// ====== 11. PREMIUM ======
function showPremiumModal() { document.getElementById('premiumModal')?.classList.add('show'); }
function celebratePremium() {
    for (let i = 0; i < 30; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.background = ['#2ecc71', '#f1c40f', '#e74c3c', '#3498db', '#9b59b6'][Math.floor(Math.random() * 5)];
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 3000);
    }
}

async function buyPremium() {
    if (!tonConnected || !tonConnectUI) { showToast('Connect TON wallet first', 'error'); return; }
    showToast('🔄 Processing...', 'info');
    try {
        const transaction = { validUntil: Math.floor(Date.now() / 1000) + 300, messages: [{ address: OWNER_WALLET, amount: '5000000000' }] };
        const result = await tonConnectUI.sendTransaction(transaction);
        if (result.boc) {
            await apiCall('/api/buy-premium', 'POST', { userId: REAL_USER_ID, txHash: result.boc });
            userData.premium = true;
            userData.avatar = '😏';
            userData.withdrawalUnlocked = true;
            await saveUserData();
            updateUI();
            closeModal('premiumModal');
            showToast('🎉 Premium Unlocked! 😏', 'success');
            celebratePremium();
        }
    } catch (error) { showToast('Payment failed: ' + error.message, 'error'); }
}

// ====== 12. ACTIONS ======
async function claimMilestone(referrals) {
    const milestone = MILESTONES.find(m => m.referrals === referrals);
    if (!milestone || milestone.isSpecial) return;
    const res = await apiCall('/api/claim-milestone', 'POST', { userId: REAL_USER_ID, milestoneReferrals: referrals, reward: milestone.reward });
    if (res.success) {
        userData.balances.TROLL += milestone.reward;
        userData.totalEarned += milestone.reward;
        if (!userData.claimedMilestones) userData.claimedMilestones = [];
        userData.claimedMilestones.push(referrals);
        localStorage.setItem(`troll_${REAL_USER_ID}`, JSON.stringify(userData));
        updateUI();
        showToast(`🎉 Claimed ${milestone.reward.toLocaleString()} TROLL!`);
    }
}

function copyInviteLink() { navigator.clipboard?.writeText(getReferralLink()); showToast('🔗 Link copied!'); }
function shareInviteLink() { tg?.openTelegramLink(`https://t.me/share/url?url=&text=${encodeURIComponent(`🧌 Join Troll Army! Get 1,000 TROLL + 500 per referral!\n\n👉 ${getReferralLink()}`)}`); }

function showSolanaWalletModal() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `<div class="modal-content"><button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button><div class="modal-icon">🔑</div><h2>Add Solana Wallet</h2><p style="margin-bottom:16px;">Enter your TROLL address on Solana</p><div class="input-group"><input type="text" id="solanaAddressInput" placeholder="GzR...kLp" style="width:100%;padding:12px;"></div><button class="modal-action-btn" onclick="saveSolanaWallet()">Save Address</button></div>`;
    document.body.appendChild(modal);
}

async function saveSolanaWallet() {
    const address = document.getElementById('solanaAddressInput')?.value.trim();
    if (!address || address.length < 32) { showToast('Invalid address', 'error'); return; }
    userData.settings = userData.settings || {};
    userData.settings.solanaWallet = address;
    await saveUserData();
    await updateMissionsProgress();
    document.querySelector('.modal')?.remove();
    showToast('✅ Wallet saved!', 'success');
    updateUI();
    if (currentPage === 'airdrop') renderMissionsUI();
}

function showDepositModal() { document.getElementById('depositModal')?.classList.add('show'); }
function showWithdrawModal() { document.getElementById('withdrawModal')?.classList.add('show'); }
function showHistory() { document.getElementById('historyModal')?.classList.add('show'); }
function showNotifications() { document.getElementById('notificationsModal')?.classList.add('show'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('show'); }
function submitDeposit() { showToast('Deposit submitted', 'success'); closeModal('depositModal'); }
function submitWithdraw() { showToast('Withdrawal requested!', 'success'); closeModal('withdrawModal'); }
function copyDepositAddress() { const addr = document.getElementById('depositAddress')?.innerText; if (addr) { navigator.clipboard?.writeText(addr); showToast('Address copied!'); } }

function refreshPrices() { fetchPrices(); showToast('Prices refreshed!'); }
function showAssetDetails(s) { const b = userData?.balances?.[s] || 0; const p = cryptoPrices[s]?.price || 0; showToast(`${s}: ${b.toLocaleString()} ($${(b * p).toFixed(2)})`); }
function showCryptoDetails(s) { const d = cryptoPrices[s] || { price: 0, change: 0 }; showToast(`${s}: $${d.price.toFixed(4)} (${d.change >= 0 ? '+' : ''}${d.change.toFixed(1)}%)`); }
function updateNotificationBadge() { const badge = document.querySelector('.badge'); if (badge && userData) { const unread = userData.notifications?.filter(n => !n.read).length || 0; badge.textContent = unread; badge.style.display = unread > 0 ? 'block' : 'none'; } }
function toggleTheme() { currentTheme = currentTheme === 'dark' ? 'light' : 'dark'; localStorage.setItem('theme', currentTheme); document.documentElement.setAttribute('data-theme', currentTheme); }
function toggleLanguage() { currentLanguage = currentLanguage === 'en' ? 'ar' : 'en'; localStorage.setItem('language', currentLanguage); location.reload(); }
function logout() { localStorage.clear(); location.reload(); }
function showComingSoon(f) { showToast(`${f} coming soon!`, 'info'); }
function openSupport() { tg?.openTelegramLink?.(`https://t.me/${appConfig.supportUsername || 'TrollSupport'}`); }

// ====== 13. NAVIGATION ======
function showWallet() {
    currentPage = 'wallet';
    document.getElementById('walletSection')?.classList.remove('hidden');
    document.getElementById('airdropSection')?.classList.add('hidden');
    document.getElementById('settingsSection')?.classList.add('hidden');
    document.querySelectorAll('.nav-item').forEach((i, idx) => i.classList.toggle('active', idx === 0));
    renderTopCryptos();
    renderMemeCoins();
}
function showAirdrop() {
    currentPage = 'airdrop';
    document.getElementById('walletSection')?.classList.add('hidden');
    document.getElementById('airdropSection')?.classList.remove('hidden');
    document.getElementById('settingsSection')?.classList.add('hidden');
    document.querySelectorAll('.nav-item').forEach((i, idx) => i.classList.toggle('active', idx === 1));
    renderMissionsUI();
    renderMilestones();
}
function showSettings() {
    currentPage = 'settings';
    document.getElementById('walletSection')?.classList.add('hidden');
    document.getElementById('airdropSection')?.classList.add('hidden');
    document.getElementById('settingsSection')?.classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach((i, idx) => i.classList.toggle('active', idx === 2));
    updateUI();
}

// ====== 14. HELPERS ======
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    document.getElementById('toastMessage').textContent = message;
    toast.querySelector('i').className = type === 'error' ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-check';
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// ====== 15. ADMIN ======
function checkAdminAndAddCrown() {
    if (REAL_USER_ID !== ADMIN_ID) return;
    const header = document.querySelector('.header-actions');
    if (!header || document.getElementById('adminCrownBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'adminCrownBtn'; btn.className = 'icon-btn';
    btn.innerHTML = '<i class="fa-solid fa-crown" style="color: gold;"></i>';
    btn.onclick = () => document.getElementById('adminPanel')?.classList.remove('hidden');
    header.insertBefore(btn, header.firstChild);
}
function closeAdminPanel() { document.getElementById('adminPanel')?.classList.add('hidden'); }
async function showAdminTab(tab) {}
async function adminRefreshStats() {}
async function adminSendBroadcast() {}

// ====== 16. INIT ======
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Troll Army v17.0 - Complete System');
    
    setTimeout(() => {
        document.getElementById('splashScreen')?.classList.add('hidden');
        document.getElementById('mainContent').style.display = 'block';
    }, 2000);
    
    initTelegramApp();
    extractUserData();
    
    if (!REAL_USER_ID) {
        const urlParams = new URLSearchParams(window.location.search);
        const startParam = urlParams.get('startapp') || urlParams.get('start') || urlParams.get('ref');
        if (startParam && /^\d+$/.test(startParam)) REAL_USER_ID = startParam;
        else {
            const savedId = localStorage.getItem('troll_user_id');
            if (savedId) REAL_USER_ID = savedId;
            else REAL_USER_ID = 'guest_' + Date.now();
        }
    }
    
    await loadConfig();
    await initTONConnect();
    
    if (!REAL_USER_ID.startsWith('guest_')) {
        await loadUserData();
    } else {
        userData = createNewUserObject(null);
        updateUI();
    }
    
    await fetchPrices();
    checkAdminAndAddCrown();
    
    setInterval(fetchPrices, 300000);
    setInterval(updateMissionsProgress, 30000);
    
    console.log('✅ Troll Army Ready!');
});

// ====== 17. EXPORTS ======
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
window.showSolanaWalletModal = showSolanaWalletModal;
window.saveSolanaWallet = saveSolanaWallet;
window.closeAdminPanel = closeAdminPanel;
window.showAdminTab = showAdminTab;
window.adminRefreshStats = adminRefreshStats;
window.adminSendBroadcast = adminSendBroadcast;

console.log('✅ v17.0 - Complete System Ready! 🧌🔥😏');
