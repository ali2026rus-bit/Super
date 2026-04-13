// ============================================================================
// TROLL ARMY - BUILT ON TRUST WALLET LITE ARCHITECTURE
// 100% Working Foundation + Mystery Missions + Referral System
// ============================================================================

// ====== 1. TELEGRAM WEBAPP & USER DETECTION (PROVEN - NO CHANGES) ======
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
    
    async function waitForTelegramUser(maxWaitMs = 5000) {
        if (!tg) {
            console.log("❌ No Telegram WebApp object");
            return null;
        }
        
        tg.ready();
        tg.expand();
        tg.enableClosingConfirmation?.();
        
        const startTime = Date.now();
        let attempts = 0;
        
        while (Date.now() - startTime < maxWaitMs) {
            attempts++;
            
            if (tg.initDataUnsafe?.user?.id) {
                const u = tg.initDataUnsafe.user;
                console.log(`✅ Telegram user found after ${attempts} attempts`);
                return {
                    id: u.id.toString(),
                    firstName: u.first_name || 'Troll',
                    lastName: u.last_name || '',
                    username: u.username || '',
                    method: 'telegram_initDataUnsafe'
                };
            }
            
            if (tg.initData) {
                try {
                    const params = new URLSearchParams(tg.initData);
                    const userJson = params.get('user');
                    if (userJson) {
                        const u = JSON.parse(decodeURIComponent(userJson));
                        if (u?.id) {
                            console.log(`✅ Telegram user found after ${attempts} attempts via initData`);
                            return {
                                id: u.id.toString(),
                                firstName: u.first_name || 'Troll',
                                lastName: u.last_name || '',
                                username: u.username || '',
                                method: 'telegram_initData'
                            };
                        }
                    }
                } catch(e) {}
            }
            
            await new Promise(r => setTimeout(r, 100));
        }
        
        console.log(`⚠️ Telegram timeout after ${attempts} attempts`);
        return null;
    }
    
    async function initUser() {
        console.log("🚀 Starting user detection (Telegram-first)...");
        
        const telegramUser = await waitForTelegramUser(5000);
        
        if (telegramUser) {
            userId = telegramUser.id;
            userName = telegramUser.firstName;
            userFirstName = telegramUser.firstName;
            userLastName = telegramUser.lastName;
            userUsername = telegramUser.username;
            authMethod = telegramUser.method;
            IS_GUEST = false;
            
            console.log("🎉 AUTHENTICATED TELEGRAM USER:", userId);
            
            localStorage.setItem('troll_user_id', userId);
            localStorage.setItem('troll_user_name', userName);
            localStorage.setItem('troll_auth_method', authMethod);
            localStorage.setItem('troll_timestamp', Date.now().toString());
            
        } else {
            console.log("⚠️ No Telegram detected, checking localStorage fallback...");
            
            const savedId = localStorage.getItem('troll_user_id');
            const savedName = localStorage.getItem('troll_user_name');
            const savedMethod = localStorage.getItem('troll_auth_method');
            const savedTime = localStorage.getItem('troll_timestamp');
            
            const isRecent = savedTime && (Date.now() - parseInt(savedTime)) < (24 * 60 * 60 * 1000);
            const isTelegramSource = savedMethod?.startsWith('telegram_');
            
            if (savedId && isTelegramSource && !savedId.startsWith('guest_') && isRecent) {
                userId = savedId;
                userName = savedName || 'Troll';
                authMethod = 'localStorage_restore';
                IS_GUEST = false;
                console.log("📦 Restored from recent Telegram session:", userId);
            } else {
                userId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
                userName = 'Guest Troll';
                authMethod = 'guest';
                IS_GUEST = true;
                console.warn("🚫 GUEST MODE - No valid Telegram session");
            }
        }
        
        window.TrollArmy.userId = userId;
        window.TrollArmy.userName = userName;
        window.TrollArmy.userFirstName = userFirstName;
        window.TrollArmy.userLastName = userLastName;
        window.TrollArmy.userUsername = userUsername;
        window.TrollArmy.isGuest = IS_GUEST;
        window.TrollArmy.authMethod = authMethod;
        window.TrollArmy.hasTelegramWebApp = !!tg;
        
        console.log("=== FINAL USER DETECTION ===");
        console.log("ID:", userId);
        console.log("Guest:", IS_GUEST);
        console.log("Method:", authMethod);
        console.log("=============================");
        
        if (typeof loadUserData === 'function') {
            await loadUserData();
        }
        
        await processReferralFromUrl();
    }
    
    async function processReferralFromUrl() {
        if (IS_GUEST) return;
        
        const urlParams = new URLSearchParams(window.location.search);
        const startParam = urlParams.get('startapp') || urlParams.get('start') || urlParams.get('ref');
        
        if (startParam && startParam !== userId) {
            console.log("🔗 Referral code detected:", startParam);
            window.TrollArmy.pendingReferral = startParam;
        }
    }
    
    initUser();
    console.log("✅ User Detection Initialized (Telegram-First)");
})();

// ====== 2. CONFIGURATION - TROLL ARMY ======
const CONFIG = {
    APP: {
        name: 'Troll Army',
        version: '1.0.0',
        botLink: 'https://t.me/TROLLMiniappbot/instant',
        adminId: '1653918641'
    },
    ECONOMY: {
        welcomeBonus: 1000,
        referralBonus: 500,
        trollPrice: 0.01915
    },
    CACHE: {
        userTTL: 300000,
        pricesTTL: 10800000
    }
};

// ====== 3. ICONS - TROLL ARMY ======
const ICONS = {
    TROLL: 'https://s2.coinmarketcap.com/static/img/coins/64x64/36313.png',
    SOL: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png',
    BNB: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png',
    ETH: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
    TRON: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1958.png',
    BTC: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png'
};

const ALL_ASSETS = [
    { symbol: 'TROLL', name: 'Troll Token' },
    { symbol: 'SOL', name: 'Solana' },
    { symbol: 'BNB', name: 'BNB' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'TRON', name: 'TRON' }
];

const TOP_CRYPTOS = [
    { symbol: 'TROLL', name: 'Troll Token' },
    { symbol: 'BTC', name: 'Bitcoin' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'BNB', name: 'BNB' },
    { symbol: 'SOL', name: 'Solana' }
];

// ====== 4. MYSTERY MISSIONS (NEW) ======
const MYSTERY_MISSIONS = {
    mission1: { id: 'solana_wallet', title: 'Mission 1: Connect Solana', desc: 'Add your TROLL Solana wallet', hint: 'Go to Settings → Solana Wallet' },
    mission2: { id: 'referral_earnings', title: 'Mission 2: Build Wealth', desc: 'Earn 12,500 TROLL from referrals', required: 12500 },
    mission3: { id: 'new_referrals', title: 'Mission 3: Expand Army', desc: 'Get 12 NEW referrals', required: 12 },
    mission4: { id: 'holdings', title: 'Mission 4: Prove Holdings', desc: 'Hold 0.025 BNB or 0.25 SOL', requiredBNB: 0.025, requiredSOL: 0.25 }
};

function getDefaultMissions() {
    return {
        mission1: { completed: false, revealed: true, walletAddress: null },
        mission2: { completed: false, revealed: false, currentAmount: 0, requiredAmount: 12500 },
        mission3: { completed: false, revealed: false, referralsAtStart: 0, currentNewReferrals: 0, requiredReferrals: 12 },
        mission4: { completed: false, revealed: false, revealDate: null, requiredBNB: 0.025, requiredSOL: 0.25 }
    };
}

// ====== 5. REFERRAL MILESTONES - TROLL ARMY ======
const REFERRAL_MILESTONES = [
    { referrals: 10, reward: 5000, title: '🤡 Baby Troll' },
    { referrals: 25, reward: 12500, title: '😈 Master Troll' },
    { referrals: 100, reward: 25000, title: '👹 Troll Lord' },
    { referrals: 250, reward: 50000, title: '🧌 Troll King' },
    { referrals: 500, reward: 100000, title: '🔥 Troll God' },
    { referrals: 1000, reward: 0, title: '💀 Grand Master', isSpecial: true }
];

// ====== 6. STATE MANAGEMENT ======
let appState = {
    prices: {},
    language: localStorage.getItem('language') || 'en',
    theme: localStorage.getItem('theme') || 'dark',
    currentPage: 'wallet',
    isAdmin: false
};

let userData = null;
let lastPricesFetch = 0;

// ====== 7. TRANSLATIONS ======
const LOCALES = {
    en: {
        'nav.wallet': 'Wallet', 'nav.airdrop': 'Missions', 'nav.settings': 'Settings',
        'actions.deposit': 'Deposit', 'actions.withdraw': 'Withdraw', 'actions.history': 'History',
        'wallet.totalBalance': 'Total Balance', 'airdrop.totalInvites': 'Total Invites',
        'airdrop.earned': 'TROLL Earned', 'airdrop.yourLink': 'Your Invite Link',
        'mission.revealLater': 'Reveals after previous mission',
        'mission.waitDays': 'Reveals in {days} days'
    },
    ar: {
        'nav.wallet': 'المحفظة', 'nav.airdrop': 'المهام', 'nav.settings': 'الإعدادات',
        'actions.deposit': 'إيداع', 'actions.withdraw': 'سحب', 'actions.history': 'السجل',
        'wallet.totalBalance': 'الرصيد الإجمالي', 'airdrop.totalInvites': 'إجمالي الدعوات',
        'airdrop.earned': 'TROLL المكتسبة', 'airdrop.yourLink': 'رابط الدعوة',
        'mission.revealLater': 'ستكشف بعد المهمة السابقة',
        'mission.waitDays': 'ستكشف بعد {days} يوم'
    }
};

function t(key, params = {}) {
    let text = LOCALES[appState.language]?.[key] || LOCALES.en[key] || key;
    Object.keys(params).forEach(k => text = text.replace(`{${k}}`, params[k]));
    return text;
}

// ====== 8. HELPER FUNCTIONS ======
function formatBalance(balance, symbol) {
    if (balance === undefined || balance === null) balance = 0;
    return symbol === 'TROLL' ? balance.toLocaleString() + ' TROLL' : balance.toLocaleString() + ' ' + symbol;
}

function formatNumber(num) {
    if (num === undefined || num === null) return '0.00';
    if (num >= 1e6) return (num/1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num/1e3).toFixed(2) + 'K';
    return num.toFixed(2);
}

function getCurrencyIcon(symbol) { return ICONS[symbol] || ICONS.TROLL; }

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    if (!toast || !toastMessage) return;
    
    toastMessage.textContent = msg;
    toast.classList.remove('hidden');
    
    const icon = toast.querySelector('i');
    if (type === 'success') icon.className = 'fas fa-check-circle';
    else if (type === 'error') icon.className = 'fas fa-exclamation-circle';
    else icon.className = 'fas fa-info-circle';
    
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function closeModal(id) { 
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('show'); 
}

function copyToClipboard(text) { 
    navigator.clipboard?.writeText(text); 
    showToast('Copied!', 'success'); 
}

// ====== 9. THEME & LANGUAGE ======
function toggleLanguage() {
    appState.language = appState.language === 'en' ? 'ar' : 'en';
    localStorage.setItem('language', appState.language);
    
    document.body.classList.toggle('rtl', appState.language === 'ar');
    document.documentElement.dir = appState.language === 'ar' ? 'rtl' : 'ltr';
    
    renderUI();
    showToast(appState.language === 'en' ? 'Language: English' : 'اللغة: العربية', 'success');
}

function toggleTheme() {
    appState.theme = appState.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', appState.theme);
    document.documentElement.setAttribute('data-theme', appState.theme);
    showToast(`Theme: ${appState.theme}`, 'success');
}

// ====== 10. API LAYER ======
async function apiCall(endpoint, method = 'GET', body = null) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    
    try {
        const res = await fetch(`/api${endpoint}`, opts);
        const data = await res.json();
        return data;
    } catch(e) {
        console.error("API Error:", e);
        return { success: false, error: e.message };
    }
}

// ====== 11. COINGECKO PRICES ======
async function fetchLivePrices(force = false) {
    const now = Date.now();
    if (!force && lastPricesFetch && (now - lastPricesFetch) < CONFIG.CACHE.pricesTTL) return;
    
    try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=troll-2,bitcoin,ethereum,binancecoin,solana&vs_currencies=usd&include_24hr_change=true');
        const data = await res.json();
        
        appState.prices = {
            TROLL: data['troll-2']?.usd || CONFIG.ECONOMY.trollPrice,
            BTC: data.bitcoin?.usd || 0,
            ETH: data.ethereum?.usd || 0,
            BNB: data.binancecoin?.usd || 0,
            SOL: data.solana?.usd || 0
        };
        
        lastPricesFetch = now;
        
        if (appState.currentPage === 'wallet') {
            renderAssets();
            renderTopCryptos();
            updateTotalBalance();
        }
    } catch(e) { console.error("Price fetch error:", e); }
}

function refreshPrices() { 
    fetchLivePrices(true); 
    showToast('Prices refreshed!', 'success'); 
}

// ====== 12. USER DATA MANAGEMENT ======
async function loadUserData() {
    try {
        const userId = window.TrollArmy.userId;
        const isGuest = window.TrollArmy.isGuest;
        
        console.log("📂 Loading user data for:", userId, "| Guest:", isGuest);
        
        appState.isAdmin = (!isGuest && userId === CONFIG.APP.adminId);
        
        const local = localStorage.getItem(`user_${userId}`);
        if (local && !isGuest) {
            userData = JSON.parse(local);
            finishLoad();
            return;
        }
        
        if (!isGuest && userId) {
            const res = await apiCall(`/users/${userId}`);
            if (res.success && res.data) {
                userData = res.data;
                if (!userData.withdrawalMissions) {
                    userData.withdrawalMissions = getDefaultMissions();
                }
                localStorage.setItem(`user_${userId}`, JSON.stringify(userData));
                finishLoad();
                return;
            }
        }
        
        document.getElementById('onboardingScreen').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('bottomNav').style.display = 'none';
        
        if (isGuest) {
            document.querySelector('.onboarding-container h1').textContent = 'Open in Telegram';
            document.querySelector('.onboarding-container p').textContent = 'Please open this app from Telegram to create your wallet';
        }
        
    } catch(e) { console.error("Load user error:", e); }
}

function finishLoad() {
    document.getElementById('onboardingScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    document.getElementById('bottomNav').style.display = 'flex';
    
    renderUI();
    checkAdminAndAddCrown();
    updateMissionsProgress();
    
    if (window.TrollArmy.pendingReferral) {
        processReferral(window.TrollArmy.pendingReferral);
    }
}

function saveUserData() {
    if (userData && !window.TrollArmy.isGuest) {
        localStorage.setItem(`user_${window.TrollArmy.userId}`, JSON.stringify(userData));
        apiCall(`/users/${window.TrollArmy.userId}`, 'PATCH', { updates: userData }).catch(console.error);
    }
}

async function createNewWallet() {
    const userId = window.TrollArmy?.userId;
    
    if (!userId || userId.startsWith('guest_')) {
        showToast('Please open from Telegram to create a wallet', 'error');
        return;
    }
    
    console.log("✅ Creating wallet for:", userId);
    
    const btn = document.getElementById('createWalletBtn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...'; }
    
    try {
        const newUser = {
            userId: userId,
            userName: window.TrollArmy.userName,
            balances: { TROLL: CONFIG.ECONOMY.welcomeBonus, BNB: 0, SOL: 0, ETH: 0, TRON: 0 },
            inviteCount: 0,
            invitedBy: window.TrollArmy.pendingReferral || null,
            referralEarnings: 0,
            totalEarned: CONFIG.ECONOMY.welcomeBonus,
            premium: false,
            avatar: '🧌',
            withdrawalUnlocked: false,
            claimedMilestones: [],
            settings: { solanaWallet: null },
            withdrawalMissions: getDefaultMissions(),
            notifications: [{ id: Date.now().toString(), message: `🎉 Welcome! +${CONFIG.ECONOMY.welcomeBonus} TROLL`, read: false, timestamp: new Date().toISOString() }],
            transactions: [],
            createdAt: new Date().toISOString()
        };
        
        const res = await apiCall('/users', 'POST', { userId: userId, userData: newUser });
        
        if (res.success) {
            userData = newUser;
            localStorage.setItem(`user_${userId}`, JSON.stringify(userData));
            
            document.getElementById('onboardingScreen').style.display = 'none';
            document.getElementById('mainApp').style.display = 'block';
            document.getElementById('bottomNav').style.display = 'flex';
            
            renderUI();
            showToast(`✅ Wallet created! +${CONFIG.ECONOMY.welcomeBonus} TROLL`, 'success');
            checkAdminAndAddCrown();
            
            if (window.TrollArmy.pendingReferral) {
                await processReferral(window.TrollArmy.pendingReferral);
            }
        }
    } catch(e) { 
        showToast('Failed to create wallet', 'error'); 
    } finally { 
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-plus-circle"></i> Create a new wallet'; } 
    }
}

function enableGuestPreview() {
    userData = {
        userId: 'demo_preview',
        userName: 'Demo User',
        balances: { TROLL: 1000, BNB: 0, SOL: 0 },
        inviteCount: 0,
        referralEarnings: 0,
        premium: false,
        avatar: '🧌',
        withdrawalUnlocked: false,
        claimedMilestones: [],
        settings: {},
        withdrawalMissions: getDefaultMissions(),
        notifications: []
    };
    
    document.getElementById('onboardingScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    document.getElementById('bottomNav').style.display = 'flex';
    
    renderUI();
    showToast('Demo Mode - Preview Only', 'info');
}

function checkAdminAndAddCrown() {
    if (!appState.isAdmin) return;
    
    const addCrown = () => {
        const headerActions = document.querySelector('.header-actions');
        if (!headerActions) return false;
        
        if (document.getElementById('adminCrownBtn')) return true;
        
        const adminBtn = document.createElement('button');
        adminBtn.id = 'adminCrownBtn';
        adminBtn.className = 'icon-btn';
        adminBtn.innerHTML = '<i class="fas fa-crown" style="color: gold;"></i>';
        adminBtn.onclick = showAdminPanel;
        adminBtn.title = 'Admin Panel';
        
        headerActions.insertBefore(adminBtn, headerActions.firstChild);
        return true;
    };
    
    if (!addCrown()) setTimeout(addCrown, 500);
}

// ====== 13. REFERRAL SYSTEM ======
async function processReferral(code) {
    if (!code || code === window.TrollArmy.userId || userData?.invitedBy) return;
    
    console.log("🔗 Processing referral:", code);
    
    const res = await apiCall('/referral', 'POST', { referrerId: code, newUserId: window.TrollArmy.userId });
    
    if (res.success && userData) {
        userData.invitedBy = code;
        userData.balances.TROLL = (userData.balances.TROLL || 0) + CONFIG.ECONOMY.referralBonus;
        userData.referralEarnings = (userData.referralEarnings || 0) + CONFIG.ECONOMY.referralBonus;
        userData.totalEarned = (userData.totalEarned || 0) + CONFIG.ECONOMY.referralBonus;
        saveUserData();
        updateMissionsProgress();
        renderUI();
        showToast(`🎉 +${CONFIG.ECONOMY.referralBonus} TROLL from referral!`, 'success');
    }
}

function copyInviteLink() { 
    const link = `${CONFIG.APP.botLink}?startapp=${window.TrollArmy.userId}`;
    copyToClipboard(link); 
}

function shareInviteLink() {
    const link = `${CONFIG.APP.botLink}?startapp=${window.TrollArmy.userId}`;
    const text = `🧌 Join Troll Army! Get ${CONFIG.ECONOMY.welcomeBonus} TROLL bonus!\n\n👉 ${link}`;
    
    if (window.TrollArmy?.hasTelegramWebApp) {
        window.Telegram?.WebApp?.openTelegramLink(`https://t.me/share/url?url=&text=${encodeURIComponent(text)}`);
    } else {
        copyToClipboard(text);
        showToast('Link copied!', 'success');
    }
}

async function claimMilestone(refs) {
    const m = REFERRAL_MILESTONES.find(x => x.referrals === refs);
    if (!m || m.isSpecial) return;
    
    if ((userData.inviteCount || 0) < refs) { 
        showToast(`Need ${refs} referrals`, 'error'); 
        return; 
    }
    
    if (userData.claimedMilestones?.includes(refs)) return;
    
    const res = await apiCall('/claim-milestone', 'POST', { userId: window.TrollArmy.userId, milestoneReferrals: refs, reward: m.reward });
    
    if (res.success) {
        userData.balances.TROLL = (userData.balances.TROLL || 0) + m.reward;
        userData.totalEarned = (userData.totalEarned || 0) + m.reward;
        if (!userData.claimedMilestones) userData.claimedMilestones = [];
        userData.claimedMilestones.push(refs);
        saveUserData();
        renderMilestones();
        updateTotalBalance();
        showToast(`✅ Claimed ${m.reward.toLocaleString()} TROLL!`, 'success');
    }
}

// ====== 14. MYSTERY MISSIONS SYSTEM ======
async function updateMissionsProgress() {
    if (!userData) return;
    
    const m = userData.withdrawalMissions;
    let changed = false;
    
    if (!m.mission1.completed && userData.settings?.solanaWallet) {
        m.mission1.completed = true;
        m.mission2.revealed = true;
        changed = true;
    }
    
    if (m.mission2.revealed && !m.mission2.completed) {
        m.mission2.currentAmount = userData.referralEarnings || 0;
        if (m.mission2.currentAmount >= m.mission2.requiredAmount) {
            m.mission2.completed = true;
            m.mission3.revealed = true;
            m.mission3.referralsAtStart = userData.inviteCount || 0;
            changed = true;
        }
    }
    
    if (m.mission3.revealed && !m.mission3.completed) {
        m.mission3.currentNewReferrals = Math.max(0, (userData.inviteCount || 0) - (m.mission3.referralsAtStart || 0));
        if (m.mission3.currentNewReferrals >= m.mission3.requiredReferrals) {
            m.mission3.completed = true;
            const revealDate = new Date();
            revealDate.setDate(revealDate.getDate() + 20);
            m.mission4.revealDate = revealDate.toISOString();
            changed = true;
        }
    }
    
    if (m.mission3.completed && !m.mission4.revealed && new Date() >= new Date(m.mission4.revealDate)) {
        m.mission4.revealed = true;
        changed = true;
    }
    
    if (m.mission4.revealed && !m.mission4.completed) {
        const bnb = userData.balances?.BNB || 0;
        const sol = userData.balances?.SOL || 0;
        if (bnb >= m.mission4.requiredBNB || sol >= m.mission4.requiredSOL) {
            m.mission4.completed = true;
            changed = true;
        }
    }
    
    const allDone = m.mission1.completed && m.mission2.completed && m.mission3.completed && m.mission4.completed;
    if (allDone && !userData.withdrawalUnlocked) {
        userData.withdrawalUnlocked = true;
        changed = true;
        showToast('🎉 Withdrawal Unlocked!', 'success');
    }
    
    if (changed) saveUserData();
    if (appState.currentPage === 'airdrop') renderMissionsUI();
}

function showSolanaWalletModal() {
    const addr = prompt('Enter your Solana wallet address (TROLL token):');
    if (addr && addr.length > 30) {
        userData.settings = userData.settings || {};
        userData.settings.solanaWallet = addr;
        saveUserData();
        updateMissionsProgress();
        renderUI();
        showToast('✅ Wallet saved!', 'success');
    } else if (addr) {
        showToast('Invalid address', 'error');
    }
}

// ====== 15. RENDER UI ======
function renderAssets() {
    const container = document.getElementById('assetsList');
    if (!container || !userData) return;
    
    container.innerHTML = ALL_ASSETS.map(asset => {
        const bal = userData.balances?.[asset.symbol] || 0;
        const price = asset.symbol === 'TROLL' ? CONFIG.ECONOMY.trollPrice : (appState.prices[asset.symbol] || 0);
        const value = bal * price;
        
        return `
            <div class="asset-item" onclick="showAssetDetails('${asset.symbol}')">
                <div class="asset-left">
                    <img src="${getCurrencyIcon(asset.symbol)}" class="asset-icon-img" alt="${asset.symbol}">
                    <div class="asset-info">
                        <h4>${asset.name}</h4>
                        <p>${asset.symbol}</p>
                    </div>
                </div>
                <div class="asset-right">
                    <div class="asset-balance">${formatBalance(bal, asset.symbol)}</div>
                    <div class="asset-value">$${formatNumber(value)}</div>
                </div>
            </div>
        `;
    }).join('');
}

function renderTopCryptos() {
    const container = document.getElementById('topCryptoList');
    if (!container) return;
    
    container.innerHTML = TOP_CRYPTOS.map(crypto => {
        const price = appState.prices[crypto.symbol] || 0;
        return `
            <div class="crypto-item" onclick="showCryptoDetails('${crypto.symbol}')">
                <div class="crypto-left">
                    <img src="${getCurrencyIcon(crypto.symbol)}" class="crypto-icon-img" alt="${crypto.symbol}">
                    <div class="crypto-info">
                        <h4>${crypto.name}</h4>
                        <p>${crypto.symbol}</p>
                    </div>
                </div>
                <div class="crypto-right">
                    <div class="crypto-price">$${formatNumber(price)}</div>
                </div>
            </div>
        `;
    }).join('');
}

function updateTotalBalance() {
    if (!userData) return;
    
    let total = 0;
    for (const asset of ALL_ASSETS) {
        const bal = userData.balances?.[asset.symbol] || 0;
        const price = asset.symbol === 'TROLL' ? CONFIG.ECONOMY.trollPrice : (appState.prices[asset.symbol] || 0);
        total += bal * price;
    }
    
    const el = document.getElementById('totalBalance');
    if (el) el.textContent = '$' + total.toFixed(2);
    
    const trollBal = userData.balances?.TROLL || 0;
    const usdEl = document.getElementById('trollUsdValue');
    if (usdEl) usdEl.textContent = (trollBal * CONFIG.ECONOMY.trollPrice).toFixed(2);
}

function renderAirdrop() {
    if (!userData) return;
    
    const link = `${CONFIG.APP.botLink}?startapp=${window.TrollArmy.userId}`;
    const inviteLinkInput = document.getElementById('inviteLink');
    if (inviteLinkInput) inviteLinkInput.value = link;
    
    document.getElementById('totalInvites').textContent = userData.inviteCount || 0;
    document.getElementById('trollEarned').textContent = (userData.referralEarnings || 0).toLocaleString();
    
    renderMissionsUI();
    renderMilestones();
}

function renderMissionsUI() {
    const container = document.getElementById('withdrawalLockCard');
    if (!container || !userData) return;
    
    if (userData.premium) {
        container.innerHTML = `<div class="premium-unlocked-card"><div class="premium-icon-large">😏</div><h3>Premium Unlocked!</h3><p>Instant withdrawal!</p></div>`;
        return;
    }
    
    const m = userData.withdrawalMissions;
    let html = `<div class="lock-header"><i class="fas fa-${userData.withdrawalUnlocked ? 'unlock' : 'lock'}"></i><span>${userData.withdrawalUnlocked ? '✅ Withdrawal Available!' : '🔒 Withdrawal Locked'}</span></div><div class="missions-list-vertical">`;
    
    // Mission 1
    html += `<div class="mission-card ${m.mission1.completed ? 'completed' : ''}"><div class="mission-icon">${m.mission1.completed ? '✅' : '1️⃣'}</div><div class="mission-content"><h4>${MYSTERY_MISSIONS.mission1.title}</h4><p>${userData.settings?.solanaWallet ? 'Wallet: ' + userData.settings.solanaWallet.slice(0,8)+'...' : MYSTERY_MISSIONS.mission1.desc}</p>${!m.mission1.completed?'<button class="mission-action-btn" onclick="showSolanaWalletModal()">Add Wallet</button>':''}</div></div>`;
    
    // Mission 2
    if (m.mission2.revealed) {
        const prog = (m.mission2.currentAmount / 12500) * 100;
        html += `<div class="mission-card ${m.mission2.completed ? 'completed' : ''}"><div class="mission-icon">${m.mission2.completed ? '✅' : '2️⃣'}</div><div class="mission-content"><h4>${MYSTERY_MISSIONS.mission2.title}</h4><p>${m.mission2.currentAmount.toLocaleString()} / 12,500 TROLL</p><div class="progress-bar small"><div class="progress-fill" style="width:${prog}%"></div></div></div></div>`;
    } else {
        html += `<div class="mission-card mystery"><div class="mission-icon">❓</div><div class="mission-content"><h4>Mission 2: ???</h4><p>${t('mission.revealLater')}</p></div></div>`;
    }
    
    // Mission 3
    if (m.mission3.revealed) {
        const prog = (m.mission3.currentNewReferrals / 12) * 100;
        html += `<div class="mission-card ${m.mission3.completed ? 'completed' : ''}"><div class="mission-icon">${m.mission3.completed ? '✅' : '3️⃣'}</div><div class="mission-content"><h4>${MYSTERY_MISSIONS.mission3.title}</h4><p>${m.mission3.currentNewReferrals} / 12 new referrals</p><div class="progress-bar small"><div class="progress-fill" style="width:${prog}%"></div></div></div></div>`;
    } else {
        html += `<div class="mission-card mystery"><div class="mission-icon">❓</div><div class="mission-content"><h4>Mission 3: ???</h4><p>${t('mission.revealLater')}</p></div></div>`;
    }
    
    // Mission 4
    if (m.mission4.revealed) {
        const bnb = userData.balances?.BNB || 0;
        const sol = userData.balances?.SOL || 0;
        html += `<div class="mission-card ${m.mission4.completed ? 'completed' : ''}"><div class="mission-icon">${m.mission4.completed ? '✅' : '4️⃣'}</div><div class="mission-content"><h4>${MYSTERY_MISSIONS.mission4.title}</h4><p>BNB: ${bnb.toFixed(4)}/0.025 | SOL: ${sol.toFixed(4)}/0.25</p></div></div>`;
    } else if (m.mission3.completed) {
        const daysLeft = Math.max(0, Math.ceil((new Date(m.mission4.revealDate) - new Date()) / 86400000));
        html += `<div class="mission-card mystery-timer"><div class="mission-icon">⏳</div><div class="mission-content"><h4>Final Mystery Mission</h4><p>${t('mission.waitDays', {days: daysLeft})}</p><div class="timer-progress-bar"><div class="timer-fill" style="width:${((20-daysLeft)/20)*100}%"></div></div></div></div>`;
    } else {
        html += `<div class="mission-card mystery"><div class="mission-icon">❓</div><div class="mission-content"><h4>Mission 4: ???</h4><p>${t('mission.revealLater')}</p></div></div>`;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

function renderMilestones() {
    const container = document.getElementById('milestonesList');
    if (!container || !userData) return;
    
    container.innerHTML = REFERRAL_MILESTONES.map(m => {
        const prog = Math.min(((userData.inviteCount || 0) / m.referrals) * 100, 100);
        const claimed = userData.claimedMilestones?.includes(m.referrals);
        const canClaim = (userData.inviteCount || 0) >= m.referrals && !claimed && !m.isSpecial;
        
        return `
            <div class="milestone-item ${claimed ? 'claimed' : ''}">
                <div class="milestone-header">
                    <span>${m.title}</span>
                    <span>${m.isSpecial ? '🎁 Mystery Box' : m.reward.toLocaleString() + ' TROLL'}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${prog}%"></div>
                </div>
                <span class="progress-text">${userData.inviteCount || 0}/${m.referrals}</span>
                ${canClaim ? `<button class="claim-btn" onclick="claimMilestone(${m.referrals})">Claim</button>` : ''}
                ${claimed ? '<p style="color:#2ecc71;text-align:center;">✓ Claimed</p>' : ''}
            </div>
        `;
    }).join('');
}

function renderUI() {
    if (appState.currentPage === 'wallet') {
        renderAssets();
        renderTopCryptos();
        updateTotalBalance();
    } else if (appState.currentPage === 'airdrop') {
        renderAirdrop();
    }
    
    const userNameEl = document.getElementById('userName');
    const userIdEl = document.getElementById('userIdDisplay');
    const avatarEl = document.getElementById('userAvatar');
    
    if (userNameEl) userNameEl.textContent = userData?.userName || window.TrollArmy.userName || 'Troll';
    if (userIdEl) userIdEl.textContent = `ID: ${(userData?.userId || window.TrollArmy.userId || '').slice(-8)}`;
    if (avatarEl) avatarEl.textContent = userData?.premium ? '😏' : (userData?.avatar || '🧌');
}

// ====== 16. NAVIGATION ======
function showWallet() {
    appState.currentPage = 'wallet';
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById('walletSection').classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector('[data-tab="wallet"]').classList.add('active');
    renderUI();
}

function showAirdrop() {
    appState.currentPage = 'airdrop';
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById('airdropSection').classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector('[data-tab="airdrop"]').classList.add('active');
    renderAirdrop();
}

function showSettings() {
    appState.currentPage = 'settings';
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById('settingsSection').classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector('[data-tab="settings"]').classList.add('active');
    
    // Update settings UI
    document.getElementById('settingsUserName').textContent = userData?.userName || 'Troll';
    document.getElementById('settingsUserId').textContent = `ID: ${window.TrollArmy.userId}`;
    const wallet = userData?.settings?.solanaWallet;
    document.getElementById('currentSolanaWallet').textContent = wallet ? wallet.slice(0,8)+'...' : 'Not set';
}

// ====== 17. MODAL FUNCTIONS ======
function showDepositModal() { document.getElementById('depositModal').classList.add('show'); }
function showWithdrawModal() { document.getElementById('withdrawModal').classList.add('show'); }
function showHistory() { document.getElementById('historyModal').classList.add('show'); }
function showNotifications() { document.getElementById('notificationsModal').classList.add('show'); }
function showAdminPanel() { document.getElementById('adminPanel').classList.remove('hidden'); }
function closeAdminPanel() { document.getElementById('adminPanel').classList.add('hidden'); }

function copyDepositAddress() {
    const addr = document.getElementById('depositAddress')?.textContent;
    if (addr) copyToClipboard(addr);
}

function submitDeposit() { showToast('Deposit submitted', 'success'); closeModal('depositModal'); }
function submitWithdraw() { showToast('Withdrawal requested', 'success'); closeModal('withdrawModal'); }

function showAssetDetails(sym) {
    const bal = userData?.balances?.[sym] || 0;
    showToast(`${sym}: ${formatBalance(bal, sym)}`, 'info');
}

function showCryptoDetails(sym) {
    const price = appState.prices[sym] || 0;
    showToast(`${sym}: $${formatNumber(price)}`, 'info');
}

function logout() { 
    if (confirm('Are you sure?')) { 
        localStorage.clear(); 
        location.reload(); 
    } 
}

function openSupport() { window.open('https://t.me/TrollSupport', '_blank'); }
function showComingSoon(f) { showToast(f + ' coming soon!', 'info'); }

// ====== 18. INITIALIZATION ======
document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 Troll Army - Built on Trust Wallet Lite Architecture");
    
    document.documentElement.setAttribute('data-theme', appState.theme);
    
    if (appState.language === 'ar') {
        document.body.classList.add('rtl');
        document.documentElement.dir = 'rtl';
    }
    
    document.getElementById('createWalletBtn')?.addEventListener('click', createNewWallet);
    document.getElementById('guestPreviewBtn')?.addEventListener('click', enableGuestPreview);
    
    await fetchLivePrices();
    
    setTimeout(() => {
        document.getElementById('splashScreen')?.classList.add('hidden');
    }, 2000);
    
    console.log("✅ Troll Army Ready!");
});

// ====== 19. EXPORTS ======
window.showWallet = showWallet;
window.showAirdrop = showAirdrop;
window.showSettings = showSettings;
window.showDepositModal = showDepositModal;
window.showWithdrawModal = showWithdrawModal;
window.showHistory = showHistory;
window.showNotifications = showNotifications;
window.showAdminPanel = showAdminPanel;
window.closeModal = closeModal;
window.closeAdminPanel = closeAdminPanel;
window.toggleLanguage = toggleLanguage;
window.toggleTheme = toggleTheme;
window.logout = logout;
window.refreshPrices = refreshPrices;
window.copyInviteLink = copyInviteLink;
window.shareInviteLink = shareInviteLink;
window.claimMilestone = claimMilestone;
window.copyDepositAddress = copyDepositAddress;
window.createNewWallet = createNewWallet;
window.enableGuestPreview = enableGuestPreview;
window.showAssetDetails = showAssetDetails;
window.showCryptoDetails = showCryptoDetails;
window.submitDeposit = submitDeposit;
window.submitWithdraw = submitWithdraw;
window.showSolanaWalletModal = showSolanaWalletModal;
window.openSupport = openSupport;
window.showComingSoon = showComingSoon;

console.log("✅✅✅ TROLL ARMY - ALL SYSTEMS READY! ✅✅✅");
