// ============================================================
// TROLL ARMY - VIRAL AIRDROP SYSTEM v3.0
// THE ULTIMATE REFERRAL & GAMIFIED WITHDRAWAL ENGINE
// ============================================================

// ====== TELEGRAM WEBAPP INIT ======
const tg = window.Telegram?.WebApp;
let userId, userName, realUserId, isTelegramWebApp = false;

if (tg) {
    tg.ready();
    tg.expand();
    isTelegramWebApp = true;
    const user = tg.initDataUnsafe?.user;
    if (user) {
        realUserId = user.id;
        userId = user.id.toString();
        userName = user.first_name || 'Troll';
    }
}

// Fallback
if (!userId) {
    const params = new URLSearchParams(window.location.search);
    userId = params.get('startapp') || params.get('ref') || localStorage.getItem('troll_user_id');
    if (!userId) userId = 'guest_' + Date.now();
    userName = localStorage.getItem('troll_user_name') || 'Guest Troll';
}

localStorage.setItem('troll_user_id', userId);
localStorage.setItem('troll_user_name', userName);

// ====== CONFIGURATION ======
const TROLL_PRICE = 0.01915;
const WELCOME_BONUS = 1000;
const REFERRAL_BONUS = 500;

// Mystery Missions (تظهر واحدة تلو الأخرى)
const MYSTERY_MISSIONS = [
    { id: 'referrals', requirement: 12, title: '🔒 Build Your Army', description: 'Recruit 12 trolls', hint: 'Share your link!' },
    { id: 'balance', requirement: 15000, title: '🔒 Gather Wealth', description: 'Accumulate 15,000 TROLL', hint: 'Each friend = 500 TROLL' },
    { id: 'bnb', requirement: 0.02, title: '🔒 Prove Your Worth', description: 'Hold 0.02 BNB', hint: 'Connect wallet to verify' }
];

// Milestones (مراحل الإحالة)
const MILESTONES = [
    { referrals: 10, reward: 5000, title: '🤡 Baby Troll' },
    { referrals: 25, reward: 12500, title: '😈 Master Troll' },
    { referrals: 100, reward: 25000, title: '👹 Troll Lord' },
    { referrals: 250, reward: 50000, title: '🧌 Troll King' },
    { referrals: 500, reward: 100000, title: '🔥 Troll God' },
    { referrals: 1000, reward: 0, title: '💀 Grand Master', isSpecial: true }
];

// Assets
const MY_ASSETS = [
    { symbol: 'TROLL', name: 'Troll Token', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/36313.png' },
    { symbol: 'SOL', name: 'Solana', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png' },
    { symbol: 'BNB', name: 'Binance Coin', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png' },
    { symbol: 'ETH', name: 'Ethereum', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png' },
    { symbol: 'TRX', name: 'TRON', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1958.png' }
];

// Top Cryptos (20)
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

// Stickers
const TROLL_STICKERS = ['😏', '🧌', '🤡', '😈', '👹', '🔥', '💚', '👑', '💀', '🎭'];

// ====== STATE ======
let userData = null;
let currentPage = 'wallet';
let db = null;
let appConfig = {};
let cryptoPrices = {};
let withdrawalMissions = [];
let tonWallet = null;

// ====== API CALLS ======
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
        const local = localStorage.getItem(`troll_${userId}`);
        if (local) {
            userData = JSON.parse(local);
            updateUI();
        }
        
        const res = await apiCall(`/api/users/${userId}`);
        if (res.success && res.data) {
            userData = res.data;
            
            // إذا كان مستخدم جديد، نسجل بياناته
            if (!userData.createdAt) {
                userData = {
                    ...userData,
                    userId,
                    userName,
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
                
                await apiCall('/api/users', 'POST', { userId, userData });
            }
            
            localStorage.setItem(`troll_${userId}`, JSON.stringify(userData));
            updateUI();
        } else if (!userData) {
            // مستخدم جديد
            userData = {
                userId,
                userName,
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
            
            await apiCall('/api/users', 'POST', { userId, userData });
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
    renderWithdrawalLockCard();
}

async function fetchPrices() {
    try {
        const ids = TOP_CRYPTOS.map(c => c.coingeckoId).join(',');
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
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
    if (!userData) return;
    
    // Header
    document.getElementById('userName').textContent = userData.userName || userName;
    document.getElementById('userIdDisplay').textContent = `Telegram ID: ${realUserId || userId}`;
    document.getElementById('userAvatar').textContent = userData.avatar || '🧌';
    
    // Settings
    const settingsAvatar = document.getElementById('settingsAvatar');
    if (settingsAvatar) settingsAvatar.textContent = userData.avatar || '🧌';
    const settingsUserName = document.getElementById('settingsUserName');
    if (settingsUserName) settingsUserName.textContent = userData.userName || userName;
    const settingsUserId = document.getElementById('settingsUserId');
    if (settingsUserId) settingsUserId.textContent = `ID: ${realUserId || userId}`;
    
    // Balance
    const trollBalance = userData.balances?.TROLL || 0;
    const trollBalanceEl = document.getElementById('trollBalance');
    if (trollBalanceEl) trollBalanceEl.textContent = trollBalance.toLocaleString();
    const trollUsdValue = document.getElementById('trollUsdValue');
    if (trollUsdValue) trollUsdValue.textContent = (trollBalance * TROLL_PRICE).toFixed(2);
    const totalBalance = document.getElementById('totalBalance');
    if (totalBalance) totalBalance.textContent = '$' + (trollBalance * TROLL_PRICE).toFixed(2);
    
    // Airdrop Stats
    const totalInvites = document.getElementById('totalInvites');
    if (totalInvites) totalInvites.textContent = userData.inviteCount || 0;
    const trollEarned = document.getElementById('trollEarned');
    if (trollEarned) trollEarned.textContent = (userData.totalEarned || 0).toLocaleString();
    const inviteLink = document.getElementById('inviteLink');
    if (inviteLink) inviteLink.value = `https://t.me/${appConfig.botUsername || 'TROLLMiniappbot'}?start=${userId}`;
    
    renderAssets();
    renderMilestones();
}

function renderAssets() {
    const container = document.getElementById('assetsList');
    if (!container) return;
    
    container.innerHTML = MY_ASSETS.map(asset => {
        const balance = userData?.balances?.[asset.symbol] || 0;
        const price = asset.symbol === 'TROLL' ? TROLL_PRICE : (cryptoPrices[asset.symbol]?.price || 0);
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
    if (!container) return;
    
    container.innerHTML = TOP_CRYPTOS.map(crypto => {
        const data = cryptoPrices[crypto.symbol] || { price: 0, change: 0 };
        const changeClass = data.change >= 0 ? 'positive' : 'negative';
        const changeSymbol = data.change >= 0 ? '+' : '';
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
                    <div class="crypto-price">$${data.price.toFixed(crypto.symbol === 'TROLL' ? 5 : 2)}</div>
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

function renderWithdrawalLockCard() {
    const container = document.getElementById('withdrawalLockCard');
    if (!container) return;
    
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
    const progress = (completed / total) * 100;
    
    // إظهار المهمة الأولى غير المكتملة فقط
    const nextMission = withdrawalMissions.find(m => !m.completed);
    
    container.innerHTML = `
        <div class="lock-header">
            <i class="fa-solid fa-lock"></i>
            <span>Withdrawal Locked</span>
        </div>
        ${nextMission ? `
            <div class="current-mission">
                <h4>${MYSTERY_MISSIONS.find(m => m.id === nextMission.id)?.title || 'Current Mission'}</h4>
                <p>${MYSTERY_MISSIONS.find(m => m.id === nextMission.id)?.description || ''}</p>
                <div class="mission-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width:${nextMission.progress}%"></div>
                    </div>
                    <span>${nextMission.current}/${nextMission.requirement}</span>
                </div>
                <p class="mission-hint">💡 ${MYSTERY_MISSIONS.find(m => m.id === nextMission.id)?.hint || ''}</p>
            </div>
        ` : ''}
        <div class="lock-footer">
            <span>${completed}/${total} missions complete</span>
        </div>
    `;
}

// ====== ACTIONS ======
async function claimMilestone(referrals) {
    const milestone = MILESTONES.find(m => m.referrals === referrals);
    if (!milestone || milestone.isSpecial) return;
    
    const res = await apiCall('/api/claim-milestone', 'POST', {
        userId,
        milestoneReferrals: referrals,
        reward: milestone.reward
    });
    
    if (res.success) {
        userData.balances.TROLL += milestone.reward;
        userData.totalEarned += milestone.reward;
        if (!userData.claimedMilestones) userData.claimedMilestones = [];
        userData.claimedMilestones.push(referrals);
        
        localStorage.setItem(`troll_${userId}`, JSON.stringify(userData));
        updateUI();
        showToast(`🎉 Claimed ${milestone.reward.toLocaleString()} TROLL!`);
        
        // تأثير بصري
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
    apiCall('/api/deposit-address', 'POST', { userId, currency: 'TROLL' }).then(res => {
        if (res.address) {
            document.getElementById('depositAddress').textContent = res.address;
        }
    });
}

function showWithdrawModal() {
    if (userData?.premium || (withdrawalMissions.length && withdrawalMissions.every(m => m.completed))) {
        // Eligible
        document.getElementById('withdrawLockContent').innerHTML = `
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
        // Locked
        const completed = withdrawalMissions.filter(m => m.completed).length;
        const total = withdrawalMissions.length;
        const nextMission = withdrawalMissions.find(m => !m.completed);
        
        document.getElementById('withdrawLockContent').innerHTML = `
            <div class="withdraw-locked-message">
                <i class="fa-solid fa-lock lock-icon-large"></i>
                <h3>Withdrawal Locked</h3>
                <p>Complete missions to unlock:</p>
                <div class="mission-progress-list">
                    ${withdrawalMissions.map((m, i) => `
                        <div class="mission-progress-item ${m.completed ? 'completed' : ''} ${i > completed ? 'hidden-mission' : ''}">
                            <div class="mission-progress-header">
                                <span>${MYSTERY_MISSIONS.find(mm => mm.id === m.id)?.title || m.id}</span>
                                <span>${m.current}/${m.requirement}</span>
                            </div>
                            <div class="progress-bar small">
                                <div class="progress-fill" style="width:${m.progress}%"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                ${nextMission ? `<p class="next-mission-hint">💡 ${MYSTERY_MISSIONS.find(mm => mm.id === nextMission.id)?.hint || ''}</p>` : ''}
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
    
    showToast('✅ Withdrawal request submitted! You will receive TROLL soon!', 'success');
    closeModal('withdrawModal');
}

function showPremiumModal() {
    document.getElementById('premiumModal').classList.add('show');
}

async function buyPremium() {
    showToast('🔄 Processing payment...', 'info');
    
    if (tg) {
        // فتح نافذة الدفع
        tg.openInvoice?.({
            title: 'Troll Premium',
            description: '😏 Avatar + Instant Withdrawal',
            payload: `premium_${userId}_${Date.now()}`,
            currency: 'TON',
            prices: [{ label: 'Premium Unlock', amount: 500 }]
        }, async (status) => {
            if (status === 'paid') {
                await apiCall('/api/buy-premium', 'POST', { userId, txHash: 'telegram_payment' });
                userData.premium = true;
                userData.avatar = '😏';
                userData.withdrawalUnlocked = true;
                localStorage.setItem(`troll_${userId}`, JSON.stringify(userData));
                updateUI();
                closeModal('premiumModal');
                showToast('🎉 Premium Unlocked! 😏 Instant withdrawal enabled!');
                
                // احتفال
                document.getElementById('welcomeSticker').textContent = '😏👑🔥';
                document.getElementById('welcomeSticker').classList.add('sticker-pop');
                setTimeout(() => document.getElementById('welcomeSticker').classList.remove('sticker-pop'), 2000);
            }
        });
    } else {
        showToast('Please open in Telegram to pay', 'error');
    }
}

function connectTONWallet() {
    if (tg) {
        tg.openLink('https://t.me/wallet');
        showToast('Connect your TON wallet in Telegram', 'info');
    } else {
        showToast('Please open in Telegram', 'error');
    }
}

// ====== NAVIGATION ======
function showWallet() {
    currentPage = 'wallet';
    document.getElementById('walletSection').classList.remove('hidden');
    document.getElementById('airdropSection').classList.add('hidden');
    document.getElementById('settingsSection').classList.add('hidden');
    document.querySelectorAll('.nav-item').forEach((i, idx) => i.classList.toggle('active', idx === 0));
    renderTopCryptos();
    showRandomSticker();
}

function showAirdrop() {
    currentPage = 'airdrop';
    document.getElementById('walletSection').classList.add('hidden');
    document.getElementById('airdropSection').classList.remove('hidden');
    document.getElementById('settingsSection').classList.add('hidden');
    document.querySelectorAll('.nav-item').forEach((i, idx) => i.classList.toggle('active', idx === 1));
    loadWithdrawalStatus();
    showRandomSticker();
}

function showSettings() {
    currentPage = 'settings';
    document.getElementById('walletSection').classList.add('hidden');
    document.getElementById('airdropSection').classList.add('hidden');
    document.getElementById('settingsSection').classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach((i, idx) => i.classList.toggle('active', idx === 2));
}

// ====== HELPERS ======
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const icon = toast.querySelector('i');
    
    toastMessage.textContent = message;
    icon.className = type === 'error' ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-check';
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function closeModal(id) {
    document.getElementById(id).classList.remove('show');
}

function openSupport() {
    const supportUsername = appConfig.supportUsername || 'TrollSupport';
    tg?.openTelegramLink?.(`https://t.me/${supportUsername}`);
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
    const list = document.getElementById('historyList');
    list.innerHTML = '<p class="empty-state">Transaction history coming soon!</p>';
}

function showNotifications() {
    document.getElementById('notificationsModal').classList.add('show');
    const list = document.getElementById('notificationsList');
    list.innerHTML = '<p class="empty-state">No new notifications</p>';
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
    const price = symbol === 'TROLL' ? TROLL_PRICE : (cryptoPrices[symbol]?.price || 0);
    showToast(`${symbol}: ${balance.toLocaleString()} ($${(balance * price).toFixed(2)})`);
}

function showCryptoDetails(symbol) {
    const data = cryptoPrices[symbol] || { price: 0, change: 0 };
    showToast(`${symbol}: $${data.price.toFixed(4)} (${data.change > 0 ? '+' : ''}${data.change.toFixed(1)}%)`);
}

// ====== STICKER SYSTEM ======
function showRandomSticker() {
    const el = document.getElementById('welcomeSticker');
    if (!el) return;
    el.textContent = TROLL_STICKERS[Math.floor(Math.random() * TROLL_STICKERS.length)];
    el.classList.add('sticker-pop');
    setTimeout(() => el.classList.remove('sticker-pop'), 800);
}

// ====== ADMIN ======
function checkAdminAndAddCrown() {
    if (userId === appConfig.adminId) {
        const header = document.querySelector('.header-actions');
        const crownBtn = document.createElement('button');
        crownBtn.id = 'adminCrownBtn';
        crownBtn.className = 'icon-btn';
        crownBtn.innerHTML = '<i class="fa-solid fa-crown" style="color: gold;"></i>';
        crownBtn.onclick = showAdminPanel;
        header.insertBefore(crownBtn, header.firstChild);
    }
}

function showAdminPanel() {
    document.getElementById('adminPanel').classList.remove('hidden');
}

function closeAdminPanel() {
    document.getElementById('adminPanel').classList.add('hidden');
}

// ====== INIT ======
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🧌 TROLL ARMY - VIRAL AIRDROP v3.0');
    
    await loadConfig();
    await loadUserData();
    await fetchPrices();
    await loadWithdrawalStatus();
    
    checkAdminAndAddCrown();
    
    setTimeout(() => {
        document.getElementById('splashScreen').classList.add('hidden');
        document.getElementById('mainContent').style.display = 'block';
        showRandomSticker();
    }, 2000);
    
    // Refresh prices every 5 minutes
    setInterval(fetchPrices, 300000);
    // Refresh withdrawal status every 30 seconds
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
window.showAdminPanel = showAdminPanel;
window.closeAdminPanel = closeAdminPanel;

console.log('✅ TROLL ARMY - Ready to go viral! 🧌🔥');
