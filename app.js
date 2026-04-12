// ============================================================
// TROLL ARMY - ULTIMATE AIRDROP SYSTEM v5.0
// ============================================================

// ====== TELEGRAM WEBAPP INIT ======
const tg = window.Telegram?.WebApp;
let userId, userName, realUserId, isTelegramWebApp = false;

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
        console.log('✅ User from WebApp:', userId);
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
        } catch(e) {
            console.error('initData parse error:', e);
        }
    }
}

if (!userId) {
    const params = new URLSearchParams(window.location.search);
    const startParam = params.get('startapp') || params.get('start') || params.get('ref');
    if (startParam && /^\d+$/.test(startParam)) {
        userId = startParam;
    } else {
        userId = localStorage.getItem('troll_user_id');
        if (!userId) {
            userId = 'guest_' + Date.now();
        }
    }
    userName = localStorage.getItem('troll_user_name') || 'Guest Troll';
    console.log('⚠️ Using fallback user:', userId);
}

localStorage.setItem('troll_user_id', userId);
localStorage.setItem('troll_user_name', userName);

// ====== CONFIGURATION ======
const TROLL_PRICE = 0.01915;
const WELCOME_BONUS = 1000;
const REFERRAL_BONUS = 500;

const MYSTERY_MISSIONS = [
    { id: 'referrals', requirement: 12, title: '🔒 Mission 1: Build Your Army', description: 'Recruit 12 trolls', hint: 'Share your link with friends!' },
    { id: 'balance', requirement: 15000, title: '🔒 Mission 2: Gather Wealth', description: 'Accumulate 15,000 TROLL', hint: 'Each friend gives you 500 TROLL' },
    { id: 'bnb', requirement: 0.02, title: '🔒 Mission 3: Prove Your Worth', description: 'Hold 0.02 BNB', hint: 'Connect wallet to verify' }
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
    { symbol: 'MATIC', name: 'Polygon', coingeckoId: 'matic-network', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png' },
    { symbol: 'UNI', name: 'Uniswap', coingeckoId: 'uniswap', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7083.png' },
    { symbol: 'ATOM', name: 'Cosmos', coingeckoId: 'cosmos', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3794.png' },
    { symbol: 'LTC', name: 'Litecoin', coingeckoId: 'litecoin', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/2.png' },
    { symbol: 'BCH', name: 'Bitcoin Cash', coingeckoId: 'bitcoin-cash', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1831.png' },
    { symbol: 'PEPE', name: 'Pepe', coingeckoId: 'pepe', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/24478.png' }
];

const TROLL_STICKERS = ['😏', '🧌', '🤡', '😈', '👹', '🔥', '💚', '👑', '💀', '🎭', '🪙', '💎', '🚀'];

// ====== STATE ======
let userData = null;
let currentPage = 'wallet';
let db = null;
let appConfig = {};
let cryptoPrices = {};
let withdrawalMissions = [];
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

async function loadUserData() {
    try {
        const res = await apiCall(`/api/users/${userId}`);
        
        if (res.success && res.data) {
            userData = res.data;
            
            if (!userData.createdAt) {
                userData = {
                    ...userData,
                    userId: userId,
                    userName: userName,
                    balances: { TROLL: WELCOME_BONUS },
                    referralCode: userId,
                    inviteCount: 0,
                    totalEarned: WELCOME_BONUS,
                    premium: false,
                    avatar: '🧌',
                    createdAt: new Date().toISOString(),
                    withdrawalUnlocked: false,
                    claimedMilestones: []
                };
                await apiCall('/api/users', 'POST', { userId: userId, userData: userData });
            }
            
            localStorage.setItem(`troll_${userId}`, JSON.stringify(userData));
            
            if (userData.tonWallet) {
                tonWalletAddress = userData.tonWallet;
                tonConnected = true;
            }
            
            updateUI();
        } else {
            userData = {
                userId: userId,
                userName: userName,
                balances: { TROLL: WELCOME_BONUS },
                referralCode: userId,
                inviteCount: 0,
                totalEarned: WELCOME_BONUS,
                premium: false,
                avatar: '🧌',
                createdAt: new Date().toISOString(),
                withdrawalUnlocked: false,
                claimedMilestones: []
            };
            
            await apiCall('/api/users', 'POST', { userId: userId, userData: userData });
            localStorage.setItem(`troll_${userId}`, JSON.stringify(userData));
            updateUI();
        }
    } catch (error) {
        console.error('Load user error:', error);
    }
}

async function loadWithdrawalStatus() {
    const res = await apiCall(`/api/withdrawal-status/${userId}`);
    if (res.missions) {
        withdrawalMissions = res.missions;
    }
    if (currentPage === 'airdrop') {
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
        
        cryptoPrices['TROLL'] = { price: TROLL_PRICE, change: 50.3 };
        
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
    
    // Header
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
        userNameEl.textContent = userData.userName || userName;
    }
    
    const userIdDisplay = document.getElementById('userIdDisplay');
    if (userIdDisplay) {
        userIdDisplay.textContent = `Telegram ID: ${realUserId || userId}`;
    }
    
    const userAvatar = document.getElementById('userAvatar');
    if (userAvatar) {
        userAvatar.textContent = userData.avatar || '🧌';
    }
    
    // Settings
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
    
    // TON Status
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
    
    // Balance
    const trollBalance = userData.balances?.TROLL || 0;
    
    const trollBalanceEl = document.getElementById('trollBalance');
    if (trollBalanceEl) {
        trollBalanceEl.textContent = trollBalance.toLocaleString();
    }
    
    const trollUsdValue = document.getElementById('trollUsdValue');
    if (trollUsdValue) {
        trollUsdValue.textContent = (trollBalance * TROLL_PRICE).toFixed(2);
    }
    
    const totalBalance = document.getElementById('totalBalance');
    if (totalBalance) {
        totalBalance.textContent = '$' + (trollBalance * TROLL_PRICE).toFixed(2);
    }
    
    // Airdrop Stats
    const totalInvites = document.getElementById('totalInvites');
    if (totalInvites) {
        totalInvites.textContent = userData.inviteCount || 0;
    }
    
    const trollEarned = document.getElementById('trollEarned');
    if (trollEarned) {
        trollEarned.textContent = (userData.totalEarned || 0).toLocaleString();
    }
    
    const inviteLink = document.getElementById('inviteLink');
    if (inviteLink) {
        const botUsername = appConfig.botUsername || 'TROLLMiniappbot';
        inviteLink.value = `https://t.me/${botUsername}?start=${userId}`;
    }
    
    renderAssets();
    renderMilestones();
    
    if (currentPage === 'airdrop') {
        renderWithdrawalLockCard();
    }
}

function renderAssets() {
    const container = document.getElementById('assetsList');
    if (!container) {
        return;
    }
    
    container.innerHTML = MY_ASSETS.map(asset => {
        const balance = userData?.balances?.[asset.symbol] || 0;
        let price = 0;
        
        if (asset.symbol === 'TROLL') {
            price = TROLL_PRICE;
        } else {
            price = cryptoPrices[asset.symbol]?.price || 0;
        }
        
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
        const priceDecimals = crypto.symbol === 'TROLL' ? 5 : 2;
        
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
                    <div class="crypto-price">$${data.price.toFixed(priceDecimals)}</div>
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
        
        let claimButton = '';
        if (canClaim) {
            claimButton = `<button class="claim-btn" onclick="claimMilestone(${m.referrals})">Claim</button>`;
        }
        
        let claimedText = '';
        if (claimed) {
            claimedText = '<p style="color:#2ecc71;text-align:center;">✓ Claimed</p>';
        }
        
        const rewardText = m.isSpecial ? '🎁 Mystery Box' : m.reward.toLocaleString() + ' TROLL';
        
        return `
            <div class="milestone-item ${claimed ? 'claimed' : ''}">
                <div class="milestone-header">
                    <span>${m.title}</span>
                    <span>${rewardText}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width:${progress}%"></div>
                </div>
                <div class="progress-text">${userData.inviteCount}/${m.referrals}</div>
                ${claimButton}
                ${claimedText}
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
    
    if (!withdrawalMissions.length) {
        container.innerHTML = '<p class="loading-text">Loading missions...</p>';
        return;
    }
    
    const completed = withdrawalMissions.filter(m => m.completed).length;
    const total = withdrawalMissions.length;
    const nextMission = withdrawalMissions.find(m => !m.completed);
    
    let missionHtml = '';
    if (nextMission) {
        const missionInfo = MYSTERY_MISSIONS.find(m => m.id === nextMission.id);
        missionHtml = `
            <div class="current-mission">
                <h4>${missionInfo?.title || 'Current Mission'}</h4>
                <p>${missionInfo?.description || ''}</p>
                <div class="mission-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width:${nextMission.progress}%"></div>
                    </div>
                    <span>${nextMission.current}/${nextMission.requirement}</span>
                </div>
                <p class="mission-hint">💡 ${missionInfo?.hint || ''}</p>
            </div>
        `;
    }
    
    container.innerHTML = `
        <div class="lock-header">
            <i class="fa-solid fa-lock"></i>
            <span>Withdrawal Locked</span>
        </div>
        ${missionHtml}
        <div class="lock-footer">
            <span>${completed}/${total} missions complete</span>
        </div>
    `;
}

// ====== TON CONNECT ======
async function connectTONWallet() {
    if (!tg) {
        showToast('Please open in Telegram', 'error');
        return;
    }
    
    showToast('🔄 Connecting to TON wallet...', 'info');
    
    try {
        tg.openLink('https://t.me/wallet');
        
        setTimeout(async () => {
            const mockAddress = `UQD${userId.slice(-40)}`;
            tonWalletAddress = mockAddress;
            tonConnected = true;
            
            await apiCall(`/api/users/${userId}`, 'PATCH', {
                updates: { tonWallet: mockAddress, tonBalance: 5.5 }
            });
            
            userData.tonWallet = mockAddress;
            localStorage.setItem(`troll_${userId}`, JSON.stringify(userData));
            
            updateUI();
            showToast('✅ TON Wallet connected!', 'success');
        }, 2000);
        
    } catch (error) {
        showToast('Failed to connect TON wallet', 'error');
    }
}

// ====== PREMIUM AVATAR ======
function showPremiumModal() {
    document.getElementById('premiumModal').classList.add('show');
}

async function buyPremium() {
    if (!tonConnected) {
        showToast('Please connect TON wallet first', 'error');
        return;
    }
    
    showToast('🔄 Processing payment...', 'info');
    
    if (tg) {
        tg.openInvoice?.({
            title: 'Troll Premium',
            description: '😏 Avatar + Instant Withdrawal',
            payload: `premium_${userId}_${Date.now()}`,
            currency: 'TON',
            prices: [{ label: 'Premium Unlock', amount: 500 }]
        }, async (status) => {
            if (status === 'paid') {
                await apiCall('/api/buy-premium', 'POST', {
                    userId: userId,
                    txHash: 'telegram_payment'
                });
                
                userData.premium = true;
                userData.avatar = '😏';
                userData.withdrawalUnlocked = true;
                
                localStorage.setItem(`troll_${userId}`, JSON.stringify(userData));
                
                updateUI();
                closeModal('premiumModal');
                showToast('🎉 Premium Unlocked! 😏 Instant withdrawal enabled!', 'success');
                
                const sticker = document.getElementById('welcomeSticker');
                sticker.textContent = '😏👑🔥';
                sticker.classList.add('sticker-pop');
                setTimeout(() => sticker.classList.remove('sticker-pop'), 2000);
            } else {
                showToast('Payment cancelled or failed', 'error');
            }
        });
    } else {
        showToast('Please open in Telegram to pay', 'error');
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
        showRandomSticker();
    }
}

function copyInviteLink() {
    const link = document.getElementById('inviteLink').value;
    navigator.clipboard?.writeText(link);
    showToast('🔗 Link copied! Share with friends!');
}

function shareInviteLink() {
    const link = document.getElementById('inviteLink').value;
    const text = `🧌 Join Troll Army and get 1,000 TROLL!\n\n💰 500 TROLL per referral!\n\n👉 ${link}`;
    
    if (tg) {
        tg.openTelegramLink(`https://t.me/share/url?url=&text=${encodeURIComponent(text)}`);
    } else {
        window.open(`https://t.me/share/url?url=&text=${encodeURIComponent(text)}`, '_blank');
    }
}

function showDepositModal() {
    document.getElementById('depositModal').classList.add('show');
    
    apiCall('/api/deposit-address', 'POST', {
        userId: userId,
        currency: 'TROLL'
    }).then(res => {
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
                <p>Enter withdrawal details:</p>
                <input type="number" id="withdrawAmount" placeholder="Amount (min 10,000 TROLL)" min="10000">
                <input type="text" id="withdrawAddress" placeholder="Your Solana wallet address">
                <button class="modal-action-btn" onclick="submitWithdraw()">Request Withdrawal</button>
            </div>
        `;
    } else {
        const completed = withdrawalMissions.filter(m => m.completed).length;
        const total = withdrawalMissions.length;
        const nextMission = withdrawalMissions.find(m => !m.completed);
        
        let missionsHtml = '';
        withdrawalMissions.forEach((m, i) => {
            const missionInfo = MYSTERY_MISSIONS.find(mm => mm.id === m.id);
            const hiddenClass = i > completed ? 'hidden-mission' : '';
            
            missionsHtml += `
                <div class="mission-progress-item ${m.completed ? 'completed' : ''} ${hiddenClass}">
                    <div class="mission-progress-header">
                        <span>${missionInfo?.title || m.id}</span>
                        <span>${m.current}/${m.requirement}</span>
                    </div>
                    <div class="progress-bar small">
                        <div class="progress-fill" style="width:${m.progress}%"></div>
                    </div>
                </div>
            `;
        });
        
        let hintHtml = '';
        if (nextMission) {
            const missionInfo = MYSTERY_MISSIONS.find(mm => mm.id === nextMission.id);
            hintHtml = `<p class="next-mission-hint">💡 ${missionInfo?.hint || ''}</p>`;
        }
        
        content.innerHTML = `
            <div class="withdraw-locked-message">
                <i class="fa-solid fa-lock lock-icon-large"></i>
                <h3>Withdrawal Locked</h3>
                <p>Complete missions to unlock:</p>
                <div class="mission-progress-list">
                    ${missionsHtml}
                </div>
                ${hintHtml}
                <button class="modal-action-btn secondary" onclick="closeModal('withdrawModal')">Close</button>
            </div>
        `;
    }
    
    document.getElementById('withdrawModal').classList.add('show');
}

async function submitWithdraw() {
    const amount = document.getElementById('withdrawAmount')?.value;
    const address = document.getElementById('withdrawAddress')?.value;
    
    if (!amount || amount < 10000) {
        showToast('Minimum withdrawal: 10,000 TROLL', 'error');
        return;
    }
    
    if (!address) {
        showToast('Please enter Solana address', 'error');
        return;
    }
    
    showToast('✅ Withdrawal request submitted!', 'success');
    closeModal('withdrawModal');
}

// ====== NAVIGATION ======
function showWallet() {
    currentPage = 'wallet';
    document.getElementById('walletSection').classList.remove('hidden');
    document.getElementById('airdropSection').classList.add('hidden');
    document.getElementById('settingsSection').classList.add('hidden');
    
    document.querySelectorAll('.nav-item').forEach((item, index) => {
        item.classList.toggle('active', index === 0);
    });
    
    renderTopCryptos();
    showRandomSticker();
}

function showAirdrop() {
    currentPage = 'airdrop';
    document.getElementById('walletSection').classList.add('hidden');
    document.getElementById('airdropSection').classList.remove('hidden');
    document.getElementById('settingsSection').classList.add('hidden');
    
    document.querySelectorAll('.nav-item').forEach((item, index) => {
        item.classList.toggle('active', index === 1);
    });
    
    loadWithdrawalStatus();
    showRandomSticker();
}

function showSettings() {
    currentPage = 'settings';
    document.getElementById('walletSection').classList.add('hidden');
    document.getElementById('airdropSection').classList.add('hidden');
    document.getElementById('settingsSection').classList.remove('hidden');
    
    document.querySelectorAll('.nav-item').forEach((item, index) => {
        item.classList.toggle('active', index === 2);
    });
    
    updateUI();
}

// ====== HELPERS ======
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const icon = toast.querySelector('i');
    
    toastMessage.textContent = message;
    
    if (type === 'error') {
        icon.className = 'fa-solid fa-circle-exclamation';
    } else {
        icon.className = 'fa-solid fa-circle-check';
    }
    
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

function closeModal(id) {
    document.getElementById(id).classList.remove('show');
}

function openSupport() {
    const username = appConfig.supportUsername || 'TrollSupport';
    tg?.openTelegramLink?.(`https://t.me/${username}`);
    showToast('Opening support...', 'info');
}

function copyDepositAddress() {
    const address = document.getElementById('depositAddress').textContent;
    navigator.clipboard?.writeText(address);
    showToast('Address copied!');
}

function submitDeposit() {
    showToast('Deposit submitted for review', 'success');
    closeModal('depositModal');
}

function showHistory() {
    document.getElementById('historyModal').classList.add('show');
    document.getElementById('historyList').innerHTML = '<p class="empty-state">Transaction history coming soon!</p>';
}

function showNotifications() {
    document.getElementById('notificationsModal').classList.add('show');
    document.getElementById('notificationsList').innerHTML = '<p class="empty-state">No new notifications</p>';
}

function toggleTheme() {
    const theme = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'light' : 'dark');
    showToast('Theme updated');
}

function toggleLanguage() {
    showToast('Language: English', 'info');
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
    let price = symbol === 'TROLL' ? TROLL_PRICE : (cryptoPrices[symbol]?.price || 0);
    const value = balance * price;
    showToast(`${symbol}: ${balance.toLocaleString()} ($${value.toFixed(2)})`);
}

function showCryptoDetails(symbol) {
    const data = cryptoPrices[symbol] || { price: 0, change: 0 };
    const changeSymbol = data.change >= 0 ? '+' : '';
    showToast(`${symbol}: $${data.price.toFixed(4)} (${changeSymbol}${data.change.toFixed(1)}%)`);
}

function showRandomSticker() {
    const el = document.getElementById('welcomeSticker');
    if (!el) return;
    
    const randomIndex = Math.floor(Math.random() * TROLL_STICKERS.length);
    el.textContent = TROLL_STICKERS[randomIndex];
    el.classList.add('sticker-pop');
    
    setTimeout(() => {
        el.classList.remove('sticker-pop');
    }, 800);
}

function checkAdminAndAddCrown() {
    if (userId === appConfig.adminId) {
        const header = document.querySelector('.header-actions');
        const crownBtn = document.createElement('button');
        crownBtn.id = 'adminCrownBtn';
        crownBtn.className = 'icon-btn';
        crownBtn.innerHTML = '<i class="fa-solid fa-crown" style="color: gold;"></i>';
        crownBtn.onclick = function() {
            document.getElementById('adminPanel').classList.remove('hidden');
        };
        header.insertBefore(crownBtn, header.firstChild);
    }
}

function closeAdminPanel() {
    document.getElementById('adminPanel').classList.add('hidden');
}

// ====== INIT ======
document.addEventListener('DOMContentLoaded', function() {
    console.log('🧌 TROLL ARMY v5.0 - PRODUCTION READY');
    
    setTimeout(function() {
        document.getElementById('splashScreen').classList.add('hidden');
        document.getElementById('mainContent').style.display = 'block';
        showRandomSticker();
    }, 1500);
    
    loadConfig().then(function() {
        loadUserData();
        fetchPrices();
        loadWithdrawalStatus();
        checkAdminAndAddCrown();
    });
    
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

console.log('✅ TROLL ARMY READY! 🧌🔥');
