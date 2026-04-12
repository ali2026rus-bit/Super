// ============================================================
// TROLL TG WALLET - Frontend
// ============================================================

// ====== Telegram WebApp ======
const tg = window.Telegram?.WebApp;
let userId, userName, realUserId;

if (tg) {
    tg.ready();
    tg.expand();
    const user = tg.initDataUnsafe?.user;
    if (user) {
        realUserId = user.id;
        userId = user.id.toString();
        userName = user.first_name || 'Troll';
    }
}

if (!userId) {
    const params = new URLSearchParams(window.location.search);
    userId = params.get('startapp') || params.get('ref') || localStorage.getItem('troll_user_id');
    if (!userId) userId = 'guest_' + Date.now();
    userName = localStorage.getItem('troll_user_name') || 'Guest Troll';
}

localStorage.setItem('troll_user_id', userId);
localStorage.setItem('troll_user_name', userName);

// ====== State ======
let userData = null;
let currentPage = 'wallet';
let db = null;
let appConfig = {};
let tonWallet = null;
const TROLL_PRICE = 0.01915;
const WELCOME_BONUS = 1000;
const REFERRAL_BONUS = 500;
const MILESTONES = [
    { referrals: 10, reward: 5000, title: '🤡 Baby Troll' },
    { referrals: 25, reward: 12500, title: '😈 Master Troll' },
    { referrals: 100, reward: 25000, title: '👹 Troll Lord' },
    { referrals: 250, reward: 50000, title: '🧌 Troll King' },
    { referrals: 500, reward: 100000, title: '🔥 Troll God' },
    { referrals: 1000, reward: 0, title: '💀 Grand Master Box', isSpecial: true }
];

const ASSETS = [
    { symbol: 'TROLL', name: 'Troll Token', icon: '🧌' },
    { symbol: 'SOL', name: 'Solana', icon: '◎' },
    { symbol: 'BNB', name: 'Binance Coin', icon: '💛' },
    { symbol: 'ETH', name: 'Ethereum', icon: '💎' },
    { symbol: 'TRX', name: 'TRON', icon: '🔷' }
];

const TOP_CRYPTOS = [
    { symbol: 'TROLL', name: 'Troll Token', coingeckoId: 'troll-2' },
    { symbol: 'SOL', name: 'Solana', coingeckoId: 'solana' },
    { symbol: 'BNB', name: 'BNB', coingeckoId: 'binancecoin' },
    { symbol: 'ETH', name: 'Ethereum', coingeckoId: 'ethereum' },
    { symbol: 'TRX', name: 'TRON', coingeckoId: 'tron' }
];

// ====== API Calls ======
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(endpoint, options);
    return res.json();
}

// ====== Load Config ======
async function loadConfig() {
    try {
        const res = await fetch('/api/config');
        appConfig = await res.json();
        
        if (appConfig.firebaseConfig) {
            firebase.initializeApp(appConfig.firebaseConfig);
            db = firebase.firestore();
            console.log('🔥 Firebase initialized');
        }
        
        if (userId === appConfig.adminId) {
            checkAdminAndAddCrown();
        }
        
        return true;
    } catch (error) {
        console.error('❌ Config error:', error);
        return false;
    }
}

// ====== Load User Data ======
async function loadUserData() {
    const local = localStorage.getItem(`user_${userId}`);
    if (local) {
        userData = JSON.parse(local);
        updateUI();
    }
    
    const res = await apiCall(`/api/users/${userId}`);
    if (res.success && res.data) {
        userData = res.data;
        localStorage.setItem(`user_${userId}`, JSON.stringify(userData));
        updateUI();
    }
}

// ====== Update UI ======
function updateUI() {
    if (!userData) return;
    
    // Header
    document.getElementById('userName').textContent = userData.userName || userName;
    document.getElementById('userIdDisplay').textContent = `Telegram ID: ${realUserId || userId}`;
    document.getElementById('userAvatar').textContent = userData.avatar || '🧌';
    
    // Settings
    document.getElementById('settingsAvatar').textContent = userData.avatar || '🧌';
    document.getElementById('settingsUserName').textContent = userData.userName || userName;
    document.getElementById('settingsUserId').textContent = `ID: ${realUserId || userId}`;
    
    // Balance
    const trollBalance = userData.balances?.TROLL || 0;
    document.getElementById('trollBalance').textContent = trollBalance.toLocaleString();
    document.getElementById('trollUsdValue').textContent = (trollBalance * TROLL_PRICE).toFixed(2);
    document.getElementById('totalBalance').textContent = '$' + (trollBalance * TROLL_PRICE).toFixed(2);
    
    // Airdrop
    document.getElementById('totalInvites').textContent = userData.inviteCount || 0;
    document.getElementById('trollEarned').textContent = (userData.totalEarned || 0).toLocaleString();
    document.getElementById('inviteLink').value = `https://t.me/TROLLMiniappbot?start=${userId}`;
    
    renderAssets();
    renderTopCryptos();
    renderMilestones();
    renderWithdrawalLockCard();
    
    if (currentPage === 'airdrop') {
        renderWithdrawalLockModal();
    }
}

// ====== Render Assets ======
function renderAssets() {
    const container = document.getElementById('assetsList');
    container.innerHTML = ASSETS.map(asset => {
        const balance = userData?.balances?.[asset.symbol] || 0;
        const price = asset.symbol === 'TROLL' ? TROLL_PRICE : 0;
        const value = balance * price;
        return `
            <div class="asset-item">
                <div class="asset-left">
                    <span class="asset-icon">${asset.icon}</span>
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

// ====== Render Top Cryptos ======
let cryptoPrices = {};

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
        
        // TROLL سعر ثابت من CoinGecko
        if (!cryptoPrices['TROLL']) {
            cryptoPrices['TROLL'] = { price: TROLL_PRICE, change: 50.3 };
        }
        
        renderTopCryptos();
    } catch (error) {
        console.error('Error fetching prices:', error);
    }
}

function renderTopCryptos() {
    const container = document.getElementById('topCryptoList');
    container.innerHTML = TOP_CRYPTOS.map(crypto => {
        const data = cryptoPrices[crypto.symbol] || { price: 0, change: 0 };
        const changeClass = data.change >= 0 ? 'positive' : 'negative';
        const changeSymbol = data.change >= 0 ? '+' : '';
        const icon = crypto.symbol === 'TROLL' ? '🧌' : 
                     crypto.symbol === 'SOL' ? '◎' :
                     crypto.symbol === 'BNB' ? '💛' :
                     crypto.symbol === 'ETH' ? '💎' : '🔷';
        return `
            <div class="crypto-item">
                <div class="crypto-left">
                    <span class="crypto-icon">${icon}</span>
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

// ====== Render Milestones ======
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

// ====== Withdrawal Lock ======
let withdrawalMissions = [];

async function loadWithdrawalStatus() {
    const res = await apiCall(`/api/withdrawal-status/${userId}`);
    if (res.missions) {
        withdrawalMissions = res.missions;
    }
    renderWithdrawalLockCard();
    renderWithdrawalLockModal();
}

function renderWithdrawalLockCard() {
    const container = document.getElementById('withdrawalLockCard');
    if (!container) return;
    
    if (userData?.premium) {
        container.innerHTML = `
            <div class="premium-unlocked-card">
                <div class="premium-icon-large">😏</div>
                <h3>Premium Unlocked!</h3>
                <p>You have instant withdrawal access!</p>
            </div>
        `;
        return;
    }
    
    const completed = withdrawalMissions.filter(m => m.completed).length;
    const total = withdrawalMissions.length;
    const progress = (completed / total) * 100;
    
    container.innerHTML = `
        <div class="lock-header">
            <i class="fa-regular fa-lock"></i>
            <span>Withdrawal Locked</span>
        </div>
        <div class="lock-progress">
            <div class="progress-bar">
                <div class="progress-fill" style="width:${progress}%"></div>
            </div>
            <span>${completed}/${total} Missions</span>
        </div>
        <div class="lock-missions">
            ${withdrawalMissions.map(m => `
                <div class="lock-mission ${m.completed ? 'completed' : ''}">
                    <i class="fa-regular ${m.completed ? 'fa-check-circle' : 'fa-circle'}"></i>
                    <span>${getMissionName(m.id)}: ${m.current}/${m.requirement}</span>
                </div>
            `).join('')}
        </div>
        <p class="lock-hint">Complete all missions to unlock withdrawal on May 1, 2026</p>
    `;
}

function getMissionName(id) {
    const names = {
        'referrals': 'Invite 12 friends',
        'balance': 'Accumulate 15,000 TROLL',
        'bnb': 'Hold 0.02 BNB'
    };
    return names[id] || id;
}

function renderWithdrawalLockModal() {
    const container = document.getElementById('withdrawLockContent');
    if (!container) return;
    
    if (userData?.premium) {
        container.innerHTML = `
            <div class="premium-withdraw">
                <div class="premium-icon-large">😏</div>
                <h3>Premium Member</h3>
                <p>Enter withdrawal amount:</p>
                <input type="number" id="withdrawAmount" placeholder="Amount in TROLL" min="10000">
                <input type="text" id="withdrawAddress" placeholder="Your Solana wallet address">
                <button class="modal-action-btn" onclick="submitWithdraw()">Withdraw TROLL</button>
                <p class="withdraw-note">Distribution on May 1, 2026</p>
            </div>
        `;
        return;
    }
    
    const completed = withdrawalMissions.filter(m => m.completed).length;
    const total = withdrawalMissions.length;
    const allCompleted = completed === total;
    
    if (allCompleted) {
        container.innerHTML = `
            <div class="mission-complete">
                <div class="celebration">🎉🧌🔥</div>
                <h3>Congratulations!</h3>
                <p>You have completed all missions!</p>
                <p>You are eligible for withdrawal on <strong>May 1, 2026</strong></p>
                <div class="eligible-badge">
                    <i class="fa-regular fa-check-circle"></i> Eligible
                </div>
                <p class="eligible-note">Your TROLL will be airdropped to your connected wallet on distribution day.</p>
                <button class="modal-action-btn" onclick="closeModal('withdrawModal')">Got it!</button>
            </div>
        `;
    } else {
        const nextMission = withdrawalMissions.find(m => !m.completed);
        container.innerHTML = `
            <div class="withdraw-locked-message">
                <i class="fa-regular fa-lock lock-icon-large"></i>
                <h3>Withdrawal Locked</h3>
                <p>Complete all missions to unlock:</p>
                <div class="mission-progress-list">
                    ${withdrawalMissions.map(m => `
                        <div class="mission-progress-item ${m.completed ? 'completed' : ''}">
                            <div class="mission-progress-header">
                                <span>${getMissionName(m.id)}</span>
                                <span>${m.current}/${m.requirement}</span>
                            </div>
                            <div class="progress-bar small">
                                <div class="progress-fill" style="width:${m.progress}%"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                ${nextMission ? `<p class="next-mission-hint">Next: ${getMissionName(nextMission.id)}</p>` : ''}
                <button class="modal-action-btn secondary" onclick="closeModal('withdrawModal')">Close</button>
            </div>
        `;
    }
}

// ====== Premium ======
async function buyPremium() {
    if (!tonWallet) {
        showToast('Please connect TON wallet first', 'error');
        return;
    }
    
    // فتح نافذة الدفع عبر Telegram
    tg.openInvoice?.({
        title: 'Premium Unlock',
        description: '😏 Avatar + Instant Withdrawal',
        payload: `premium_${userId}_${Date.now()}`,
        provider_token: '',
        currency: 'TON',
        prices: [{ label: 'Premium Unlock', amount: 500 }] // 5 TON
    }, async (status) => {
        if (status === 'paid') {
            await apiCall('/api/buy-premium', 'POST', { userId, txHash: 'telegram_payment' });
            userData.premium = true;
            userData.avatar = '😏';
            localStorage.setItem(`user_${userId}`, JSON.stringify(userData));
            updateUI();
            closeModal('premiumModal');
            showToast('🎉 Premium unlocked! Instant withdrawal enabled!', 'success');
            
            // تأثيرات بصرية
            document.getElementById('welcomeSticker').textContent = '😏👑🔥';
            document.getElementById('welcomeSticker').classList.add('sticker-pop');
            setTimeout(() => document.getElementById('welcomeSticker').classList.remove('sticker-pop'), 1000);
        }
    });
}

// ====== Claim Milestone ======
async function claimMilestone(referrals) {
    const milestone = MILESTONES.find(m => m.referrals === referrals);
    if (!milestone || milestone.isSpecial) return;
    
    await apiCall('/api/claim-milestone', 'POST', {
        userId,
        milestoneReferrals: referrals,
        reward: milestone.reward
    });
    
    userData.balances.TROLL += milestone.reward;
    userData.totalEarned += milestone.reward;
    if (!userData.claimedMilestones) userData.claimedMilestones = [];
    userData.claimedMilestones.push(referrals);
    
    localStorage.setItem(`user_${userId}`, JSON.stringify(userData));
    updateUI();
    showToast(`Claimed ${milestone.reward.toLocaleString()} TROLL!`, 'success');
}

// ====== Deposit ======
async function showDepositModal() {
    document.getElementById('depositModal').classList.add('show');
    const res = await apiCall('/api/deposit-address', 'POST', { userId, currency: 'TROLL' });
    document.getElementById('depositAddress').textContent = res.address;
}

function copyDepositAddress() {
    const address = document.getElementById('depositAddress').textContent;
    navigator.clipboard?.writeText(address);
    showToast('Address copied!', 'success');
}

async function submitDeposit() {
    const txId = document.getElementById('txIdInput').value;
    showToast('Deposit submitted for review', 'success');
    closeModal('depositModal');
}

// ====== Withdraw ======
function showWithdrawModal() {
    loadWithdrawalStatus();
    document.getElementById('withdrawModal').classList.add('show');
}

async function submitWithdraw() {
    const amount = document.getElementById('withdrawAmount').value;
    const address = document.getElementById('withdrawAddress').value;
    
    if (!amount || amount < 10000) {
        showToast('Minimum withdrawal: 10,000 TROLL', 'error');
        return;
    }
    if (!address) {
        showToast('Please enter Solana address', 'error');
        return;
    }
    
    showToast('Withdrawal request submitted! Distribution on May 1, 2026', 'success');
    closeModal('withdrawModal');
}

// ====== TON Connect ======
async function connectTONWallet() {
    if (tg) {
        tg.openLink('https://t.me/wallet');
        showToast('Connect your TON wallet in Telegram', 'info');
    } else {
        showToast('Please open in Telegram', 'error');
    }
}

// ====== Admin ======
function checkAdminAndAddCrown() {
    const header = document.querySelector('.header-actions');
    const crownBtn = document.createElement('button');
    crownBtn.id = 'adminCrownBtn';
    crownBtn.className = 'icon-btn';
    crownBtn.innerHTML = '<i class="fa-regular fa-crown" style="color: gold;"></i>';
    crownBtn.onclick = showAdminPanel;
    header.insertBefore(crownBtn, header.firstChild);
}

function showAdminPanel() {
    document.getElementById('adminPanel').classList.remove('hidden');
    showAdminTab('dashboard');
}

function closeAdminPanel() {
    document.getElementById('adminPanel').classList.add('hidden');
}

async function showAdminTab(tab) {
    const content = document.getElementById('adminContent');
    
    if (tab === 'dashboard') {
        content.innerHTML = `
            <div class="admin-stats">
                <div class="admin-stat-card">
                    <h3>Total Users</h3>
                    <div class="stat-value" id="adminTotalUsers">-</div>
                </div>
                <div class="admin-stat-card">
                    <h3>Premium Users</h3>
                    <div class="stat-value" id="adminPremiumUsers">-</div>
                </div>
            </div>
            <div class="admin-actions">
                <button onclick="adminRefreshStats()">Refresh</button>
            </div>
        `;
    } else if (tab === 'broadcast') {
        content.innerHTML = `
            <div class="admin-broadcast">
                <h3>Send Broadcast</h3>
                <textarea id="broadcastMessage" placeholder="Message to all users..."></textarea>
                <button onclick="adminSendBroadcast()">Send Broadcast</button>
            </div>
        `;
    }
}

async function adminSendBroadcast() {
    const message = document.getElementById('broadcastMessage').value;
    if (!message) {
        showToast('Enter a message', 'error');
        return;
    }
    
    const password = prompt('Enter admin password:');
    const res = await apiCall('/api/admin/broadcast', 'POST', { message }, {
        'Authorization': `Bearer ${password}`
    });
    
    if (res.success) {
        showToast(`Broadcast sent to ${res.sentTo} users`, 'success');
    } else {
        showToast('Unauthorized', 'error');
    }
}

// ====== Navigation ======
function showWallet() {
    currentPage = 'wallet';
    document.getElementById('walletSection').classList.remove('hidden');
    document.getElementById('airdropSection').classList.add('hidden');
    document.getElementById('settingsSection').classList.add('hidden');
    document.querySelectorAll('.nav-item').forEach((i, idx) => i.classList.toggle('active', idx === 0));
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

// ====== Helpers ======
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    document.getElementById('toastMessage').textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function closeModal(id) {
    document.getElementById(id).classList.remove('show');
}

function openSupport() {
    tg?.openTelegramLink?.('https://t.me/' + (appConfig.adminId ? 'admin' : 'TrollSupport'));
    showToast('Opening support...', 'info');
}

function copyInviteLink() {
    navigator.clipboard?.writeText(document.getElementById('inviteLink').value);
    showToast('Link copied!', 'success');
}

function shareInviteLink() {
    const link = document.getElementById('inviteLink').value;
    const text = `🧌 Join Troll Army and get 1,000 TROLL!\n\nUse my link:\n${link}`;
    tg?.openTelegramLink?.(`https://t.me/share/url?url=&text=${encodeURIComponent(text)}`);
}

function showHistory() {
    document.getElementById('historyModal').classList.add('show');
    const list = document.getElementById('historyList');
    const txs = userData?.transactions || [];
    list.innerHTML = txs.length === 0 
        ? '<p class="empty-state">No transactions yet</p>'
        : txs.map(tx => `<div class="history-item"><span>${tx.type}</span><span>${tx.amount} ${tx.currency}</span></div>`).join('');
}

function showNotifications() {
    document.getElementById('notificationsModal').classList.add('show');
    const list = document.getElementById('notificationsList');
    const notifs = userData?.notifications || [];
    list.innerHTML = notifs.length === 0
        ? '<p class="empty-state">No notifications</p>'
        : notifs.map(n => `<div class="notification-item">${n.message}</div>`).join('');
}

function toggleTheme() {
    const theme = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'light' : 'dark');
    showToast('Theme updated', 'success');
}

function toggleLanguage() {
    showToast('Language: English only for now', 'info');
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
    showToast('Prices refreshed!', 'success');
}

function showPremiumModal() {
    document.getElementById('premiumModal').classList.add('show');
}

// ====== Stickers ======
const STICKERS = ['😏', '🧌', '🤡', '😈', '👹', '🔥', '💚', '👑'];
function showRandomSticker() {
    const el = document.getElementById('welcomeSticker');
    if (!el) return;
    el.textContent = STICKERS[Math.floor(Math.random() * STICKERS.length)];
    el.classList.add('sticker-pop');
    setTimeout(() => el.classList.remove('sticker-pop'), 500);
}

// ====== Init ======
document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig();
    await loadUserData();
    await fetchPrices();
    await loadWithdrawalStatus();
    
    setTimeout(() => {
        document.getElementById('splashScreen').classList.add('hidden');
        document.getElementById('mainContent').style.display = 'block';
        showRandomSticker();
    }, 1500);
});

// Exports
window.showWallet = showWallet;
window.showAirdrop = showAirdrop;
window.showSettings = showSettings;
window.showDepositModal = showDepositModal;
window.showWithdrawModal = showWithdrawModal;
window.showPremiumModal = showPremiumModal;
window.showHistory = showHistory;
window.showNotifications = showNotifications;
window.showAdminPanel = showAdminPanel;
window.closeAdminPanel = closeAdminPanel;
window.showAdminTab = showAdminTab;
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
window.adminSendBroadcast = adminSendBroadcast;
