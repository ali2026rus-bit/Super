// ============================================================================
// TROLL ARMY - MYSTERY MISSIONS SYSTEM v18.0 FINAL
// Telegram WebApp + Firebase + 4 Mystery Missions + 20-Day Timer
// ============================================================================

// ====== 1. TELEGRAM WEBAPP & USER DETECTION ======
(function() {
    window.TrollArmy = window.TrollArmy || {};
    
    const tg = window.Telegram?.WebApp;
    let userId = null;
    let userName = 'Troll';
    let userFirstName = 'Troll';
    let userLastName = '';
    let userUsername = '';
    let authMethod = 'none';
    let IS_GUEST = true;
    
    function detectTelegramUser() {
        if (!tg) {
            console.log("❌ No Telegram WebApp");
            return null;
        }
        
        tg.ready();
        tg.expand();
        
        console.log("🔍 Detecting Telegram user...");
        
        // Method 1: initDataUnsafe
        if (tg.initDataUnsafe?.user?.id) {
            const u = tg.initDataUnsafe.user;
            console.log("✅ User via initDataUnsafe:", u.id);
            return {
                id: u.id.toString(),
                firstName: u.first_name || 'Troll',
                lastName: u.last_name || '',
                username: u.username || '',
                method: 'telegram_initDataUnsafe'
            };
        }
        
        // Method 2: initData parse
        if (tg.initData) {
            try {
                const params = new URLSearchParams(tg.initData);
                const userJson = params.get('user');
                if (userJson) {
                    const u = JSON.parse(decodeURIComponent(userJson));
                    if (u?.id) {
                        console.log("✅ User via initData:", u.id);
                        return {
                            id: u.id.toString(),
                            firstName: u.first_name || 'Troll',
                            lastName: u.last_name || '',
                            username: u.username || '',
                            method: 'telegram_initData'
                        };
                    }
                }
            } catch(e) { console.error("Parse error:", e); }
        }
        
        console.log("❌ No Telegram user found");
        return null;
    }
    
    async function initUser() {
        console.log("🚀 Starting user detection...");
        
        await new Promise(r => setTimeout(r, 500));
        
        const telegramUser = detectTelegramUser();
        
        if (telegramUser) {
            userId = telegramUser.id;
            userName = telegramUser.firstName;
            userFirstName = telegramUser.firstName;
            userLastName = telegramUser.lastName;
            userUsername = telegramUser.username;
            authMethod = telegramUser.method;
            IS_GUEST = false;
            
            console.log("🎉 AUTHENTICATED:", userId, "|", userName);
            
            localStorage.setItem('troll_user_id', userId);
            localStorage.setItem('troll_user_name', userName);
            localStorage.setItem('troll_auth_method', authMethod);
            localStorage.setItem('troll_timestamp', Date.now().toString());
            
        } else {
            const savedId = localStorage.getItem('troll_user_id');
            const savedMethod = localStorage.getItem('troll_auth_method');
            const savedTime = localStorage.getItem('troll_timestamp');
            const isRecent = savedTime && (Date.now() - parseInt(savedTime)) < (24 * 60 * 60 * 1000);
            
            if (savedId && savedMethod?.startsWith('telegram_') && !savedId.startsWith('guest_') && isRecent) {
                userId = savedId;
                userName = localStorage.getItem('troll_user_name') || 'Troll';
                authMethod = 'localStorage_restore';
                IS_GUEST = false;
                console.log("📦 Restored from localStorage:", userId);
            } else {
                userId = 'guest_' + Date.now();
                userName = 'Guest';
                authMethod = 'guest';
                IS_GUEST = true;
                console.warn("🚫 GUEST MODE");
            }
        }
        
        window.TrollArmy.userId = userId;
        window.TrollArmy.userName = userName;
        window.TrollArmy.userFirstName = userFirstName;
        window.TrollArmy.userUsername = userUsername;
        window.TrollArmy.isGuest = IS_GUEST;
        window.TrollArmy.authMethod = authMethod;
        window.TrollArmy.hasTelegramWebApp = !!tg;
        
        console.log("=== FINAL ===", userId, "| Guest:", IS_GUEST);
        
        if (typeof handleUserReady === 'function') {
            await handleUserReady();
        }
        
        await processReferralFromUrl();
    }
    
    async function processReferralFromUrl() {
        if (IS_GUEST) return;
        
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('startapp') || params.get('start') || params.get('ref');
        
        if (ref && ref !== userId) {
            console.log("🔗 Referral:", ref);
            window.TrollArmy.pendingReferral = ref;
        }
    }
    
    initUser();
    console.log("✅ User Detection Ready");
})();

// ====== 2. CONFIGURATION ======
const CONFIG = {
    APP: {
        name: 'Troll Army',
        version: '18.0.0',
        botLink: 'https://t.me/TROLLMiniappbot/instant',
        adminId: null,
        ownerWallet: null
    },
    ECONOMY: {
        welcomeBonus: 1000,
        referralBonus: 500,
        trollPriceFallback: 0.01915
    },
    CACHE: {
        pricesTTL: 10800000
    }
};

// ====== 3. MYSTERY MISSIONS ======
const MYSTERY_MISSIONS = {
    mission1: { id: 'solana_wallet', title: 'Mission 1: Connect Solana', desc: 'Add your TROLL Solana wallet', hint: 'Go to Settings → Solana Wallet' },
    mission2: { id: 'referral_earnings', title: 'Mission 2: Build Wealth', desc: 'Earn 12,500 TROLL from referrals', hint: 'Each referral gives 500 TROLL', required: 12500 },
    mission3: { id: 'new_referrals', title: 'Mission 3: Expand Army', desc: 'Get 12 NEW referrals', hint: 'Only new referrals count', required: 12 },
    mission4: { id: 'holdings', title: 'Mission 4: Prove Holdings', desc: 'Hold 0.025 BNB or 0.25 SOL', hint: 'Deposit to your wallet', requiredBNB: 0.025, requiredSOL: 0.25 }
};

// ====== 4. MILESTONES ======
const REFERRAL_MILESTONES = [
    { referrals: 10, reward: 5000, title: '🤡 Baby Troll' },
    { referrals: 25, reward: 12500, title: '😈 Master Troll' },
    { referrals: 100, reward: 25000, title: '👹 Troll Lord' },
    { referrals: 250, reward: 50000, title: '🧌 Troll King' },
    { referrals: 500, reward: 100000, title: '🔥 Troll God' },
    { referrals: 1000, reward: 0, title: '💀 Grand Master', isSpecial: true }
];

// ====== 5. ICONS ======
const ICONS = {
    TROLL: 'https://s2.coinmarketcap.com/static/img/coins/64x64/36313.png',
    SOL: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png',
    BNB: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png',
    ETH: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
    TRON: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1958.png',
    BTC: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png',
    DOGE: 'https://s2.coinmarketcap.com/static/img/coins/64x64/74.png',
    SHIB: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5994.png',
    PEPE: 'https://s2.coinmarketcap.com/static/img/coins/64x64/24478.png'
};

const ALL_ASSETS = [
    { symbol: 'TROLL', name: 'Troll Token' },
    { symbol: 'SOL', name: 'Solana' },
    { symbol: 'BNB', name: 'BNB' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'TRON', name: 'TRON' }
];

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
    { symbol: 'PEPE', name: 'Pepe', coingeckoId: 'pepe' }
];

// ====== 6. STATE ======
let userData = null;
let db = null;
let appConfig = {};
let appState = {
    prices: {},
    language: localStorage.getItem('language') || 'en',
    theme: localStorage.getItem('theme') || 'dark',
    currentPage: 'wallet',
    isAdmin: false
};
let tonConnectUI = null;
let tonConnected = false;
let tonWalletAddress = null;
let lastPricesFetch = 0;

// ====== 7. HELPERS ======
function t(key, params = {}) {
    const texts = {
        en: { 'withdrawal.unlocked': 'Withdrawal Unlocked!', 'premium.unlocked': 'Premium Unlocked!', 'mission.revealLater': 'Reveals after previous mission', 'mission.waitDays': 'Reveals in {days} days' },
        ar: { 'withdrawal.unlocked': 'تم فتح السحب!', 'premium.unlocked': 'تم تفعيل البريميوم!', 'mission.revealLater': 'ستكشف بعد المهمة السابقة', 'mission.waitDays': 'ستكشف بعد {days} يوم' }
    };
    let text = texts[appState.language]?.[key] || key;
    Object.keys(params).forEach(k => text = text.replace(`{${k}}`, params[k]));
    return text;
}

function formatBalance(bal, sym) {
    if (bal === undefined) bal = 0;
    return sym === 'TROLL' ? bal.toLocaleString() + ' TROLL' : bal.toLocaleString() + ' ' + sym;
}

function formatNumber(num) {
    if (!num) return '0.00';
    if (num >= 1e6) return (num/1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num/1e3).toFixed(2) + 'K';
    return num.toFixed(2);
}

function getIcon(sym) { return ICONS[sym] || ICONS.TROLL; }

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toastMessage');
    if (!toast || !msgEl) return;
    msgEl.textContent = msg;
    toast.classList.remove('hidden');
    const icon = toast.querySelector('i');
    icon.className = type === 'success' ? 'fa-solid fa-circle-check' : type === 'error' ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-info';
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function closeModal(id) { document.getElementById(id)?.classList.remove('show'); }
function copyToClipboard(text) { navigator.clipboard?.writeText(text); showToast('Copied!', 'success'); }

// ====== 8. API ======
async function apiCall(endpoint, method = 'GET', body = null) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    try {
        const res = await fetch(`/api${endpoint}`, opts);
        return await res.json();
    } catch(e) { return { success: false, error: e.message }; }
}

// ====== 9. CONFIG & FIREBASE ======
async function loadConfig() {
    try {
        const res = await fetch('/api/config');
        appConfig = await res.json();
        if (appConfig.adminId) CONFIG.APP.adminId = appConfig.adminId;
        if (appConfig.ownerWallet) CONFIG.APP.ownerWallet = appConfig.ownerWallet;
        if (appConfig.firebaseConfig && typeof firebase !== 'undefined' && !firebase.apps.length) {
            firebase.initializeApp(appConfig.firebaseConfig);
            db = firebase.firestore();
        }
        return true;
    } catch(e) { return false; }
}

// ====== 10. PRICES ======
async function fetchPrices(force = false) {
    const now = Date.now();
    if (!force && lastPricesFetch && (now - lastPricesFetch) < CONFIG.CACHE.pricesTTL) return;
    try {
        const all = [...TOP_CRYPTOS, ...MEME_COINS];
        const ids = all.map(c => c.coingeckoId).join(',');
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
        const data = await res.json();
        all.forEach(c => { if (data[c.coingeckoId]) appState.prices[c.symbol] = { price: data[c.coingeckoId].usd, change: data[c.coingeckoId].usd_24h_change || 0 }; });
        if (!appState.prices['TROLL']) appState.prices['TROLL'] = { price: CONFIG.ECONOMY.trollPriceFallback, change: 0 };
        lastPricesFetch = now;
        if (appState.currentPage === 'wallet') { renderAssets(); renderTopCryptos(); renderMemeCoins(); updateTotalBalance(); }
    } catch(e) { appState.prices['TROLL'] = { price: CONFIG.ECONOMY.trollPriceFallback, change: 0 }; }
}

// ====== 11. USER DATA ======
function getDefaultMissions() {
    return {
        mission1: { completed: false, revealed: true, walletAddress: null },
        mission2: { completed: false, revealed: false, currentAmount: 0, requiredAmount: 12500 },
        mission3: { completed: false, revealed: false, referralsAtStart: 0, currentNewReferrals: 0, requiredReferrals: 12 },
        mission4: { completed: false, revealed: false, revealDate: null, requiredBNB: 0.025, requiredSOL: 0.25 }
    };
}

async function saveUserData() {
    if (userData && !window.TrollArmy.isGuest) {
        localStorage.setItem(`troll_${window.TrollArmy.userId}`, JSON.stringify(userData));
        await apiCall(`/users/${window.TrollArmy.userId}`, 'PATCH', { updates: userData });
    }
}

async function createNewUser() {
    const userId = window.TrollArmy.userId;
    if (!userId || userId.startsWith('guest_')) return false;
    
    const newUser = {
        userId, userName: window.TrollArmy.userName, userUsername: window.TrollArmy.userUsername,
        balances: { TROLL: CONFIG.ECONOMY.welcomeBonus, BNB: 0, SOL: 0, ETH: 0, TRON: 0 },
        referralCode: userId, referredBy: window.TrollArmy.pendingReferral || null,
        referrals: [], inviteCount: 0, referralEarnings: 0, totalEarned: CONFIG.ECONOMY.welcomeBonus,
        premium: false, avatar: '🧌', createdAt: new Date().toISOString(), withdrawalUnlocked: false,
        claimedMilestones: [], tonWallet: null, settings: { solanaWallet: null },
        withdrawalMissions: getDefaultMissions(),
        notifications: [{ id: Date.now().toString(), message: `🎉 Welcome! +${CONFIG.ECONOMY.welcomeBonus} TROLL`, read: false, timestamp: new Date().toISOString() }],
        transactions: []
    };
    
    const res = await apiCall('/users', 'POST', { userId, userData: newUser });
    if (res.success) { userData = newUser; localStorage.setItem(`troll_${userId}`, JSON.stringify(userData)); return true; }
    return false;
}

async function handleUserReady() {
    const userId = window.TrollArmy.userId;
    const isGuest = window.TrollArmy.isGuest;
    
    appState.isAdmin = (!isGuest && userId === CONFIG.APP.adminId);
    
    if (isGuest) {
        showGuestOnboarding();
        return;
    }
    
    const res = await apiCall(`/users/${userId}`);
    
    if (res.success && res.data) {
        userData = res.data;
        if (!userData.withdrawalMissions) { userData.withdrawalMissions = getDefaultMissions(); await saveUserData(); }
        localStorage.setItem(`troll_${userId}`, JSON.stringify(userData));
    } else {
        const created = await createNewUser();
        if (!created) { showToast('Failed to create account', 'error'); return; }
    }
    
    hideAllScreens();
    document.getElementById('mainApp').style.display = 'block';
    document.getElementById('bottomNav').style.display = 'flex';
    
    renderUI();
    checkAdminAndAddCrown();
    
    if (window.TrollArmy.pendingReferral) await processReferral(window.TrollArmy.pendingReferral);
    await updateMissionsProgress();
}

function showGuestOnboarding() {
    hideAllScreens();
    const el = document.getElementById('guestOnboardingScreen') || document.getElementById('onboardingScreen');
    if (el) el.style.display = 'flex';
}

function hideAllScreens() {
    ['onboardingScreen', 'guestOnboardingScreen', 'mainApp'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    const nav = document.getElementById('bottomNav');
    if (nav) nav.style.display = 'none';
}

function enableGuestPreview() {
    userData = { userId: 'demo', userName: 'Demo', balances: { TROLL: 1000 }, inviteCount: 0, referralEarnings: 0, premium: false, avatar: '🧌', withdrawalUnlocked: false, settings: {}, withdrawalMissions: getDefaultMissions(), notifications: [] };
    hideAllScreens();
    document.getElementById('mainApp').style.display = 'block';
    document.getElementById('bottomNav').style.display = 'flex';
    renderUI();
    showToast('Demo Mode', 'info');
}

// ====== 12. REFERRAL ======
async function processReferral(code) {
    if (!code || code === window.TrollArmy.userId || userData?.referredBy) return;
    const res = await apiCall('/referral', 'POST', { referrerId: code, newUserId: window.TrollArmy.userId });
    if (res.success && userData) {
        userData.referredBy = code;
        userData.balances.TROLL += CONFIG.ECONOMY.referralBonus;
        userData.referralEarnings += CONFIG.ECONOMY.referralBonus;
        userData.totalEarned += CONFIG.ECONOMY.referralBonus;
        await saveUserData(); await updateMissionsProgress(); renderUI();
        showToast(`🎉 +${CONFIG.ECONOMY.referralBonus} TROLL from referral!`, 'success');
    }
}

function getReferralLink() { return `${CONFIG.APP.botLink}?startapp=${window.TrollArmy.userId}`; }
function copyInviteLink() { copyToClipboard(getReferralLink()); }
function shareInviteLink() {
    const text = `🧌 Join Troll Army! Get ${CONFIG.ECONOMY.welcomeBonus} TROLL + ${CONFIG.ECONOMY.referralBonus} per referral!\n\n👉 ${getReferralLink()}`;
    window.Telegram?.WebApp?.openTelegramLink(`https://t.me/share/url?url=&text=${encodeURIComponent(text)}`);
}

async function claimMilestone(refs) {
    const m = REFERRAL_MILESTONES.find(x => x.referrals === refs);
    if (!m || m.isSpecial || userData.claimedMilestones?.includes(refs) || (userData.inviteCount || 0) < refs) return;
    const res = await apiCall('/claim-milestone', 'POST', { userId: window.TrollArmy.userId, milestoneReferrals: refs, reward: m.reward });
    if (res.success) {
        userData.balances.TROLL += m.reward; userData.totalEarned += m.reward;
        if (!userData.claimedMilestones) userData.claimedMilestones = [];
        userData.claimedMilestones.push(refs);
        await saveUserData(); renderMilestones(); updateTotalBalance();
        showToast(`✅ Claimed ${m.reward.toLocaleString()} TROLL!`, 'success');
    }
}

// ====== 13. MYSTERY MISSIONS ======
async function updateMissionsProgress() {
    if (!userData) return;
    const m = userData.withdrawalMissions; let changed = false;
    
    if (!m.mission1.completed && userData.settings?.solanaWallet) {
        m.mission1.completed = true; m.mission1.walletAddress = userData.settings.solanaWallet;
        if (!m.mission2.revealed) { m.mission2.revealed = true; addNotification('🔓 Mission 2 revealed!'); }
        changed = true;
    }
    if (m.mission2.revealed && !m.mission2.completed) {
        m.mission2.currentAmount = userData.referralEarnings || 0;
        if (m.mission2.currentAmount >= m.mission2.requiredAmount) {
            m.mission2.completed = true;
            if (!m.mission3.revealed) { m.mission3.revealed = true; m.mission3.referralsAtStart = userData.inviteCount || 0; addNotification('🔓 Mission 3 revealed!'); }
            changed = true;
        }
    }
    if (m.mission3.revealed && !m.mission3.completed) {
        m.mission3.currentNewReferrals = Math.max(0, (userData.inviteCount || 0) - (m.mission3.referralsAtStart || 0));
        if (m.mission3.currentNewReferrals >= m.mission3.requiredReferrals) {
            m.mission3.completed = true;
            const d = new Date(); d.setDate(d.getDate() + 20); m.mission4.revealDate = d.toISOString();
            addNotification('⏳ Final mission reveals in 20 days!');
            changed = true;
        }
    }
    if (m.mission3.completed && !m.mission4.revealed && new Date() >= new Date(m.mission4.revealDate)) {
        m.mission4.revealed = true; addNotification('🔓 Final mission revealed!'); changed = true;
    }
    if (m.mission4.revealed && !m.mission4.completed) {
        const bnb = userData.balances?.BNB || 0, sol = userData.balances?.SOL || 0;
        if (bnb >= m.mission4.requiredBNB || sol >= m.mission4.requiredSOL) { m.mission4.completed = true; changed = true; }
    }
    
    const allDone = m.mission1.completed && m.mission2.completed && m.mission3.completed && m.mission4.completed;
    if (allDone && !userData.withdrawalUnlocked) {
        userData.withdrawalUnlocked = true; addNotification('🎉 WITHDRAWAL UNLOCKED!'); celebrateUnlock(); changed = true;
    }
    
    if (changed) await saveUserData();
    if (appState.currentPage === 'airdrop') renderMissionsUI();
}

function addNotification(msg) {
    if (!userData.notifications) userData.notifications = [];
    userData.notifications.unshift({ id: Date.now().toString(), message: msg, read: false, timestamp: new Date().toISOString() });
}

function celebrateUnlock() {
    for (let i = 0; i < 50; i++) { setTimeout(() => { const c = document.createElement('div'); c.className = 'confetti'; c.style.left = Math.random()*100+'%'; c.style.background = ['#FFD700','#2ecc71','#e74c3c','#3498db'][Math.floor(Math.random()*4)]; document.body.appendChild(c); setTimeout(() => c.remove(), 4000); }, i*50); }
    showToast('🎉 Withdrawal Unlocked!', 'success');
}

// ====== 14. SOLANA WALLET ======
function showSolanaWalletModal() {
    const modal = document.createElement('div'); modal.className = 'modal show';
    modal.innerHTML = `<div class="modal-content"><button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button><div class="modal-icon">🔑</div><h2>Add Solana Wallet</h2><p style="margin-bottom:16px;">Enter your TROLL address on Solana</p><div class="input-group"><input type="text" id="solanaAddressInput" placeholder="GzR...kLp" style="width:100%;padding:12px;"></div><button class="modal-action-btn" onclick="saveSolanaWallet()">Save Address</button></div>`;
    document.body.appendChild(modal);
}
async function saveSolanaWallet() {
    const addr = document.getElementById('solanaAddressInput')?.value.trim();
    if (!addr || addr.length < 32) { showToast('Invalid address', 'error'); return; }
    userData.settings = userData.settings || {}; userData.settings.solanaWallet = addr;
    await saveUserData(); await updateMissionsProgress();
    document.querySelector('.modal')?.remove(); showToast('✅ Wallet saved!', 'success'); renderUI();
}

// ====== 15. RENDER ======
function renderUI() {
    if (!userData) return;
    document.getElementById('userName').textContent = userData.userName || window.TrollArmy.userName;
    document.getElementById('userIdDisplay').textContent = `ID: ${(userData.userId || '').slice(-8)}`;
    const av = document.getElementById('userAvatar');
    if (av) { av.innerHTML = userData.premium ? getTrollFaceSVG() : (userData.avatar || '🧌'); if (userData.premium) av.classList.add('avatar-premium'); }
    
    if (appState.currentPage === 'wallet') { renderAssets(); renderTopCryptos(); renderMemeCoins(); updateTotalBalance(); }
    else if (appState.currentPage === 'airdrop') { renderAirdrop(); renderMissionsUI(); renderMilestones(); }
    else if (appState.currentPage === 'settings') renderSettings();
}
function getTrollFaceSVG() { return `<svg viewBox="0 0 100 100" width="40" height="40"><defs><radialGradient id="f"><stop offset="0%" stop-color="#FFD700"/><stop offset="100%" stop-color="#DAA520"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#f)"/><path d="M28 68 Q50 88,78 58 Q82 52,75 48 Q58 70,28 62Z" fill="#2C1810"/><ellipse cx="35" cy="40" rx="8" ry="10" fill="#FFF"/><circle cx="38" cy="40" r="3"/><ellipse cx="65" cy="40" rx="8" ry="10" fill="#FFF"/><circle cx="62" cy="42" r="3"/></svg>`; }
function renderAssets() {
    const c = document.getElementById('assetsList'); if (!c) return;
    c.innerHTML = ALL_ASSETS.map(a => { const b = userData.balances?.[a.symbol]||0, p = appState.prices[a.symbol]?.price||0; return `<div class="asset-item" onclick="showAssetDetails('${a.symbol}')"><div class="asset-left"><img src="${getIcon(a.symbol)}"><div><h4>${a.name}</h4><p>${a.symbol}</p></div></div><div class="asset-right"><div>${formatBalance(b,a.symbol)}</div>${b*p>0?`<div>$${formatNumber(b*p)}</div>`:''}</div></div>`; }).join('');
}
function renderTopCryptos() {
    const c = document.getElementById('topCryptoList'); if (!c) return;
    c.innerHTML = TOP_CRYPTOS.map(x => { const d = appState.prices[x.symbol]||{price:0,change:0}; return `<div class="crypto-item" onclick="showCryptoDetails('${x.symbol}')"><div class="crypto-left"><img src="${getIcon(x.symbol)}"><div><h4>${x.name}</h4><p>${x.symbol}</p></div></div><div class="crypto-right"><div>$${d.price.toFixed(x.symbol==='TROLL'?5:2)}</div><div class="${d.change>=0?'positive':'negative'}">${d.change>=0?'+':''}${d.change.toFixed(1)}%</div></div></div>`; }).join('');
}
function renderMemeCoins() {
    const c = document.getElementById('memeCoinList'); if (!c) return;
    c.innerHTML = MEME_COINS.map(x => { const d = appState.prices[x.symbol]||{price:0,change:0}; return `<div class="crypto-item" onclick="showCryptoDetails('${x.symbol}')"><div class="crypto-left"><img src="${getIcon(x.symbol)}"><div><h4>${x.name}</h4><p>${x.symbol}</p></div></div><div class="crypto-right"><div>$${d.price.toFixed(8)}</div><div class="${d.change>=0?'positive':'negative'}">${d.change>=0?'+':''}${d.change.toFixed(1)}%</div></div></div>`; }).join('');
}
function updateTotalBalance() {
    let t = 0; ALL_ASSETS.forEach(a => t += (userData.balances?.[a.symbol]||0) * (appState.prices[a.symbol]?.price||0));
    document.getElementById('totalBalance').textContent = '$'+t.toFixed(2);
    const tb = userData.balances?.TROLL||0, tp = appState.prices['TROLL']?.price||CONFIG.ECONOMY.trollPriceFallback;
    document.getElementById('trollBalance').textContent = tb.toLocaleString();
    document.getElementById('trollUsdValue').textContent = (tb*tp).toFixed(2);
}
function renderAirdrop() {
    document.getElementById('totalInvites').textContent = userData.inviteCount||0;
    document.getElementById('trollEarned').textContent = (userData.referralEarnings||0).toLocaleString();
    document.getElementById('inviteLink').value = getReferralLink();
}
function renderMissionsUI() {
    const c = document.getElementById('withdrawalLockCard'); if (!c) return;
    const m = userData.withdrawalMissions;
    if (userData.premium) { c.innerHTML = `<div class="premium-unlocked-card"><div class="premium-icon-large">😏</div><h3>Premium Unlocked!</h3><p>Instant withdrawal!</p></div>`; return; }
    let h = `<div class="lock-header"><i class="fa-solid fa-${userData.withdrawalUnlocked?'unlock':'lock'}"></i><span>${userData.withdrawalUnlocked?'✅ Withdrawal Available!':'🔒 Withdrawal Locked'}</span></div><div class="missions-list-vertical">`;
    h += `<div class="mission-card ${m.mission1.completed?'completed':''}"><div class="mission-icon">${m.mission1.completed?'✅':'1️⃣'}</div><div class="mission-content"><h4>${MYSTERY_MISSIONS.mission1.title}</h4><p>${userData.settings?.solanaWallet?'Wallet: '+userData.settings.solanaWallet.slice(0,8)+'...':MYSTERY_MISSIONS.mission1.desc}</p>${!m.mission1.completed?`<button class="mission-action-btn" onclick="showSolanaWalletModal()">Add Wallet</button>`:''}</div></div>`;
    if (m.mission2.revealed) { const p = (m.mission2.currentAmount/12500)*100; h += `<div class="mission-card ${m.mission2.completed?'completed':''}"><div class="mission-icon">${m.mission2.completed?'✅':'2️⃣'}</div><div class="mission-content"><h4>${MYSTERY_MISSIONS.mission2.title}</h4><p>${m.mission2.currentAmount.toLocaleString()} / 12,500 TROLL</p><div class="progress-bar small"><div class="progress-fill" style="width:${p}%"></div></div><p class="mission-hint">💡 ${MYSTERY_MISSIONS.mission2.hint}</p></div></div>`; }
    else h += `<div class="mission-card mystery"><div class="mission-icon">❓</div><div class="mission-content"><h4>Mission 2: ???</h4><p>${t('mission.revealLater')}</p></div></div>`;
    if (m.mission3.revealed) { const p = (m.mission3.currentNewReferrals/12)*100; h += `<div class="mission-card ${m.mission3.completed?'completed':''}"><div class="mission-icon">${m.mission3.completed?'✅':'3️⃣'}</div><div class="mission-content"><h4>${MYSTERY_MISSIONS.mission3.title}</h4><p>${m.mission3.currentNewReferrals} / 12 new referrals</p><div class="progress-bar small"><div class="progress-fill" style="width:${p}%"></div></div><p class="mission-hint">💡 ${MYSTERY_MISSIONS.mission3.hint}</p></div></div>`; }
    else h += `<div class="mission-card mystery"><div class="mission-icon">❓</div><div class="mission-content"><h4>Mission 3: ???</h4><p>${t('mission.revealLater')}</p></div></div>`;
    if (m.mission4.revealed) { const bnb=userData.balances?.BNB||0, sol=userData.balances?.SOL||0; h += `<div class="mission-card ${m.mission4.completed?'completed':''}"><div class="mission-icon">${m.mission4.completed?'✅':'4️⃣'}</div><div class="mission-content"><h4>${MYSTERY_MISSIONS.mission4.title}</h4><p>BNB: ${bnb.toFixed(4)}/0.025 | SOL: ${sol.toFixed(4)}/0.25</p><p class="mission-hint">💡 ${MYSTERY_MISSIONS.mission4.hint}</p></div></div>`; }
    else if (m.mission3.completed) { const d = new Date(m.mission4.revealDate), left = Math.max(0, Math.ceil((d-new Date())/(1000*60*60*24))); h += `<div class="mission-card mystery-timer"><div class="mission-icon">⏳</div><div class="mission-content"><h4>Final Mystery Mission</h4><p>${t('mission.waitDays',{days:left})}</p><div class="timer-progress-bar"><div class="timer-fill" style="width:${((20-left)/20)*100}%"></div></div></div></div>`; }
    else h += `<div class="mission-card mystery"><div class="mission-icon">❓</div><div class="mission-content"><h4>Mission 4: ???</h4><p>${t('mission.revealLater')}</p></div></div>`;
    h += `</div>`; c.innerHTML = h;
}
function renderMilestones() {
    const c = document.getElementById('milestonesList'); if (!c) return;
    c.innerHTML = REFERRAL_MILESTONES.map(m => { const p = Math.min(((userData.inviteCount||0)/m.referrals)*100,100), claimed = userData.claimedMilestones?.includes(m.referrals), can = (userData.inviteCount||0)>=m.referrals && !claimed && !m.isSpecial; return `<div class="milestone-item ${claimed?'claimed':''}"><div class="milestone-header"><span>${m.title}</span><span>${m.isSpecial?'🎁':m.reward.toLocaleString()+' TROLL'}</span></div><div class="progress-bar"><div class="progress-fill" style="width:${p}%"></div></div><div class="progress-text">${userData.inviteCount||0}/${m.referrals}</div>${can?`<button class="claim-btn" onclick="claimMilestone(${m.referrals})">Claim</button>`:''}${claimed?'<p style="color:#2ecc71;">✓ Claimed</p>':''}</div>`; }).join('');
}
function renderSettings() {
    const av = document.getElementById('settingsAvatar'); if (av) { av.innerHTML = userData?.premium ? getTrollFaceSVG() : (userData?.avatar || '🧌'); }
    document.getElementById('settingsUserName').textContent = userData?.userName || window.TrollArmy.userName;
    document.getElementById('settingsUserId').textContent = `ID: ${window.TrollArmy.userId}`;
    const sw = document.getElementById('currentSolanaWallet'); if (sw) { const w = userData?.settings?.solanaWallet; sw.textContent = w ? w.slice(0,8)+'...'+w.slice(-4) : 'Not set'; }
    const ts = document.getElementById('tonWalletStatus'); if (ts) { ts.textContent = tonConnected && tonWalletAddress ? `${tonWalletAddress.slice(0,6)}...${tonWalletAddress.slice(-6)}` : 'Not connected'; ts.style.color = tonConnected ? '#2ecc71' : ''; }
}

// ====== 16. TON CONNECT ======
async function initTONConnect() {
    if (typeof TON_CONNECT_UI === 'undefined') return;
    try { tonConnectUI = new TON_CONNECT_UI.TonConnectUI({ manifestUrl: `${location.origin}/tonconnect-manifest.json`, buttonRootId: 'tonConnectButton' }); const r = await tonConnectUI.connectionRestored; if (r && tonConnectUI.wallet) { tonConnected = true; tonWalletAddress = tonConnectUI.wallet.account.address; } } catch(e) {}
}
async function connectTONWallet() {
    if (!tonConnectUI) return;
    try { await tonConnectUI.openModal(); const i = setInterval(async () => { if (tonConnectUI.wallet) { clearInterval(i); tonConnected = true; tonWalletAddress = tonConnectUI.wallet.account.address; userData.tonWallet = tonWalletAddress; await saveUserData(); renderSettings(); showToast('✅ Connected!', 'success'); } }, 500); setTimeout(() => clearInterval(i), 30000); } catch(e) {}
}
function showPremiumModal() { document.getElementById('premiumModal')?.classList.add('show'); }
async function buyPremium() {
    if (!tonConnected) { showToast('Connect TON wallet first', 'error'); return; }
    try { const tx = { validUntil: Math.floor(Date.now()/1000)+300, messages: [{ address: CONFIG.APP.ownerWallet, amount: '5000000000' }] }; const r = await tonConnectUI.sendTransaction(tx); if (r.boc) { await apiCall('/buy-premium', 'POST', { userId: window.TrollArmy.userId, txHash: r.boc }); userData.premium = true; userData.avatar = '😏'; userData.withdrawalUnlocked = true; await saveUserData(); renderUI(); closeModal('premiumModal'); showToast('🎉 Premium!', 'success'); } } catch(e) {}
}

// ====== 17. DEPOSIT/WITHDRAW ======
function showDepositModal() { document.getElementById('depositModal')?.classList.add('show'); document.getElementById('depositAddress').textContent = '0xbf70420f57342c6Bd4267430D4D3b7E946f09450'; }
function showWithdrawModal() { if (!userData?.withdrawalUnlocked && !userData?.premium) { showToast('Complete missions first!', 'error'); return; } document.getElementById('withdrawModal')?.classList.add('show'); }
function showHistory() { document.getElementById('historyModal')?.classList.add('show'); renderHistory(); }
function copyDepositAddress() { copyToClipboard(document.getElementById('depositAddress')?.textContent); }
async function submitDeposit() { showToast('Deposit submitted', 'success'); closeModal('depositModal'); }
async function submitWithdraw() { const a = document.getElementById('withdrawAmount')?.value; if (!a || a < 10000) { showToast('Min 10,000 TROLL', 'error'); return; } showToast('Withdrawal requested!', 'success'); closeModal('withdrawModal'); }
function renderHistory() {
    const c = document.getElementById('historyList'); if (!c) return;
    const t = userData?.transactions || [];
    c.innerHTML = t.length ? t.reverse().slice(0,20).map(tx => `<div class="history-item"><div><span class="history-type ${tx.type}">${tx.type}</span><span>${tx.status}</span></div><div><span>${tx.amount} ${tx.currency}</span><span>${new Date(tx.timestamp).toLocaleString()}</span></div></div>`).join('') : '<p class="empty-state">No transactions</p>';
}

// ====== 18. NAVIGATION ======
function showWallet() { appState.currentPage = 'wallet'; document.querySelectorAll('.section').forEach(s => s.classList.add('hidden')); document.getElementById('walletSection')?.classList.remove('hidden'); document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active')); document.querySelector('[data-tab="wallet"]')?.classList.add('active'); renderUI(); }
function showAirdrop() { appState.currentPage = 'airdrop'; document.querySelectorAll('.section').forEach(s => s.classList.add('hidden')); document.getElementById('airdropSection')?.classList.remove('hidden'); document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active')); document.querySelector('[data-tab="airdrop"]')?.classList.add('active'); renderUI(); }
function showSettings() { appState.currentPage = 'settings'; document.querySelectorAll('.section').forEach(s => s.classList.add('hidden')); document.getElementById('settingsSection')?.classList.remove('hidden'); document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active')); document.querySelector('[data-tab="settings"]')?.classList.add('active'); renderSettings(); }

// ====== 19. THEME/LANGUAGE ======
function toggleLanguage() { appState.language = appState.language === 'en' ? 'ar' : 'en'; localStorage.setItem('language', appState.language); document.body.classList.toggle('rtl', appState.language==='ar'); document.documentElement.dir = appState.language==='ar'?'rtl':'ltr'; renderUI(); }
function toggleTheme() { appState.theme = appState.theme==='light'?'dark':'light'; localStorage.setItem('theme', appState.theme); document.documentElement.setAttribute('data-theme', appState.theme); }
function logout() { if (confirm('Logout?')) { localStorage.clear(); location.reload(); } }

// ====== 20. HELPERS ======
function showAssetDetails(s) { const b = userData?.balances?.[s]||0, p = appState.prices[s]?.price||0; showToast(`${s}: ${formatBalance(b,s)} ($${formatNumber(b*p)})`, 'info'); }
function showCryptoDetails(s) { const d = appState.prices[s]||{price:0,change:0}; showToast(`${s}: $${d.price.toFixed(6)} (${d.change>=0?'+':''}${d.change.toFixed(1)}%)`, 'info'); }
function showNotifications() { document.getElementById('notificationsModal')?.classList.add('show'); const c = document.getElementById('notificationsList'); if (c) { const n = userData?.notifications||[]; c.innerHTML = n.length ? n.map(x => `<div class="notification-item"><div>${x.message}</div><div>${new Date(x.timestamp).toLocaleString()}</div></div>`).join('') : '<p class="empty-state">No notifications</p>'; } }
function openSupport() { window.open('https://t.me/TrollSupport', '_blank'); }
function showComingSoon(f) { showToast(`${f} coming soon!`, 'info'); }
function refreshPrices() { fetchPrices(true); showToast('Prices refreshed!', 'success'); }
function checkAdminAndAddCrown() { if (!appState.isAdmin) return; const h = document.querySelector('.header-actions'); if (h && !document.getElementById('adminCrownBtn')) { const b = document.createElement('button'); b.id = 'adminCrownBtn'; b.className = 'icon-btn'; b.innerHTML = '<i class="fa-solid fa-crown" style="color:gold;"></i>'; b.onclick = showAdminPanel; h.insertBefore(b, h.firstChild); } }
function showAdminPanel() { document.getElementById('adminPanel')?.classList.remove('hidden'); }
function closeAdminPanel() { document.getElementById('adminPanel')?.classList.add('hidden'); }

// ====== 21. INIT ======
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Troll Army v18.0');
    document.documentElement.setAttribute('data-theme', appState.theme);
    if (appState.language === 'ar') { document.body.classList.add('rtl'); document.documentElement.dir = 'rtl'; }
    
    document.getElementById('createWalletBtn')?.addEventListener('click', async () => {
        const btn = document.getElementById('createWalletBtn');
        btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        const created = await createNewUser();
        if (created) { hideAllScreens(); document.getElementById('mainApp').style.display = 'block'; document.getElementById('bottomNav').style.display = 'flex'; renderUI(); checkAdminAndAddCrown(); }
        else { showToast('Failed to create account', 'error'); btn.disabled = false; btn.innerHTML = '<i class="fas fa-plus-circle"></i> Create New Wallet'; }
    });
    
    setTimeout(() => document.getElementById('splashScreen')?.classList.add('hidden'), 2000);
    await loadConfig();
    await initTONConnect();
    await fetchPrices();
    setInterval(fetchPrices, 300000);
    console.log('✅ Ready!');
});

// ====== 22. EXPORTS ======
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
window.saveSolanaWallet = saveSolanaWallet;
window.enableGuestPreview = enableGuestPreview;

console.log('✅✅✅ TROLL ARMY v18.0 FINAL - ALL SYSTEMS READY! ✅✅✅');
