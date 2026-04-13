// ============================================================================
// TROLL ARMY - PROFESSIONAL MINI APP
// Version: Final 1.0
// Features: Telegram Auth + Firebase + Mystery Missions + Referrals + TON
// ============================================================================

// ====== 1. GLOBAL STATE ======
const STATE = {
    user: null,
    userId: null,
    isGuest: true,
    currentPage: 'wallet',
    prices: {},
    language: 'en',
    theme: 'dark',
    isAdmin: false
};

// ====== 2. CONFIG ======
const CONFIG = {
    BOT_LINK: 'https://t.me/TROLLMiniappbot/instant',
    WELCOME_BONUS: 1000,
    REFERRAL_BONUS: 500,
    TROLL_PRICE: 0.01915
};

// ====== 3. UTILITIES ======
function log(message, data = null) {
    const prefix = '🧌 [Troll Army]';
    if (data) {
        console.log(prefix, message, data);
    } else {
        console.log(prefix, message);
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toastMessage');
    if (!toast || !msgEl) return;
    
    msgEl.textContent = message;
    toast.classList.remove('hidden');
    
    const icon = toast.querySelector('i');
    if (icon) {
        icon.className = type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
    }
    
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function hideElement(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
}

function showElement(id, display = 'block') {
    const el = document.getElementById(id);
    if (el) el.style.display = display;
}

// ====== 4. API CALLS ======
async function api(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(`/api${endpoint}`, options);
        const data = await response.json();
        return data;
    } catch (error) {
        log('API Error:', error);
        return { success: false, error: error.message };
    }
}

// ====== 5. TELEGRAM DETECTION ======
function getTelegramUser() {
    const tg = window.Telegram?.WebApp;
    
    if (!tg) {
        log('No Telegram WebApp');
        return null;
    }
    
    tg.ready();
    tg.expand();
    
    // Try initDataUnsafe
    if (tg.initDataUnsafe?.user) {
        const u = tg.initDataUnsafe.user;
        log('User from initDataUnsafe:', u.id);
        return {
            id: u.id.toString(),
            name: u.first_name || 'Troll',
            username: u.username || '',
            initData: tg.initData || ''
        };
    }
    
    // Try initData
    if (tg.initData) {
        try {
            const params = new URLSearchParams(tg.initData);
            const userJson = params.get('user');
            if (userJson) {
                const u = JSON.parse(decodeURIComponent(userJson));
                log('User from initData:', u.id);
                return {
                    id: u.id.toString(),
                    name: u.first_name || 'Troll',
                    username: u.username || '',
                    initData: tg.initData
                };
            }
        } catch (e) {
            log('Parse error:', e);
        }
    }
    
    log('No user found in Telegram');
    return null;
}

// ====== 6. USER REGISTRATION ======
async function registerUser(telegramUser) {
    log('Registering user:', telegramUser.id);
    
    // First, try to authenticate with server
    if (telegramUser.initData) {
        try {
            const res = await api('/init-user', 'POST', { initData: telegramUser.initData });
            
            if (res.success && res.userData) {
                log('Server authenticated user');
                return res.userData;
            }
            
            if (res.needsRegistration) {
                log('New user, creating...');
            }
        } catch (e) {
            log('Server auth failed, using local:', e);
        }
    }
    
    // Create new user locally
    const newUser = {
        userId: telegramUser.id,
        userName: telegramUser.name,
        userUsername: telegramUser.username,
        balances: {
            TROLL: CONFIG.WELCOME_BONUS,
            BNB: 0,
            SOL: 0,
            ETH: 0,
            TRON: 0
        },
        referralCode: telegramUser.id,
        referredBy: getReferralFromUrl(),
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
        settings: { solanaWallet: null },
        notifications: [{
            id: Date.now().toString(),
            message: `🎉 Welcome! +${CONFIG.WELCOME_BONUS} TROLL`,
            read: false,
            timestamp: new Date().toISOString()
        }],
        transactions: []
    };
    
    // Save to server
    try {
        await api('/users', 'POST', {
            userId: telegramUser.id,
            userData: newUser
        });
        log('User saved to server');
    } catch (e) {
        log('Server save failed, using localStorage:', e);
    }
    
    return newUser;
}

function getReferralFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('startapp') || params.get('start') || params.get('ref') || null;
}

async function processReferral(referrerId) {
    if (!referrerId || referrerId === STATE.userId) return;
    if (STATE.user.referredBy) return;
    
    log('Processing referral:', referrerId);
    
    try {
        const res = await api('/referral', 'POST', {
            referrerId,
            newUserId: STATE.userId
        });
        
        if (res.success) {
            STATE.user.referredBy = referrerId;
            STATE.user.balances.TROLL += CONFIG.REFERRAL_BONUS;
            STATE.user.referralEarnings += CONFIG.REFERRAL_BONUS;
            STATE.user.totalEarned += CONFIG.REFERRAL_BONUS;
            
            await saveUserData();
            showToast(`🎉 +${CONFIG.REFERRAL_BONUS} TROLL from referral!`, 'success');
        }
    } catch (e) {
        log('Referral error:', e);
    }
}

// ====== 7. GUEST MODE ======
function createGuestUser() {
    log('Creating guest user');
    
    const guestId = 'guest_' + Date.now();
    
    STATE.user = {
        userId: guestId,
        userName: 'Guest',
        balances: { TROLL: 0, BNB: 0, SOL: 0, ETH: 0, TRON: 0 },
        inviteCount: 0,
        referralEarnings: 0,
        premium: false,
        avatar: '🧌',
        withdrawalUnlocked: false,
        claimedMilestones: [],
        settings: {},
        notifications: []
    };
    
    STATE.userId = guestId;
    STATE.isGuest = true;
}

// ====== 8. SAVE & LOAD ======
async function saveUserData() {
    if (!STATE.user || STATE.isGuest) return;
    
    const key = `user_${STATE.userId}`;
    localStorage.setItem(key, JSON.stringify(STATE.user));
    
    try {
        await api(`/users/${STATE.userId}`, 'PATCH', { updates: STATE.user });
    } catch (e) {
        log('Save error:', e);
    }
}

function loadUserFromStorage(userId) {
    const key = `user_${userId}`;
    const saved = localStorage.getItem(key);
    
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            return null;
        }
    }
    
    return null;
}

// ====== 9. MAIN INITIALIZATION ======
async function initializeApp() {
    log('🚀 Initializing Troll Army...');
    
    // Get Telegram user
    const telegramUser = getTelegramUser();
    
    if (telegramUser) {
        // Real Telegram user
        STATE.isGuest = false;
        STATE.userId = telegramUser.id;
        
        // Try to load from storage first
        let user = loadUserFromStorage(telegramUser.id);
        
        if (user) {
            log('Loaded from storage');
            STATE.user = user;
        } else {
            // Try to load from server
            try {
                const res = await api(`/users/${telegramUser.id}`);
                if (res.success && res.data) {
                    log('Loaded from server');
                    STATE.user = res.data;
                } else {
                    // Register new user
                    STATE.user = await registerUser(telegramUser);
                }
            } catch (e) {
                log('Server error, registering locally');
                STATE.user = await registerUser(telegramUser);
            }
        }
        
        // Save to storage
        localStorage.setItem(`user_${STATE.userId}`, JSON.stringify(STATE.user));
        
        // Process referral if any
        const ref = getReferralFromUrl();
        if (ref && ref !== STATE.userId) {
            await processReferral(ref);
        }
        
    } else {
        // Guest mode
        createGuestUser();
    }
    
    // Check admin
    STATE.isAdmin = (STATE.userId === '1653918641');
    
    // Save to global
    window.TrollArmy = {
        userId: STATE.userId,
        userName: STATE.user?.userName || 'Guest',
        isGuest: STATE.isGuest
    };
    
    // Hide splash, show app
    hideElement('splashScreen');
    showElement('mainApp');
    showElement('bottomNav', 'flex');
    
    // Render UI
    renderUI();
    
    // Add admin crown if needed
    if (STATE.isAdmin) {
        addAdminCrown();
    }
    
    log('✅ App ready!', {
        userId: STATE.userId,
        isGuest: STATE.isGuest,
        balance: STATE.user?.balances?.TROLL
    });
}

// ====== 10. UI RENDERING ======
function renderUI() {
    if (!STATE.user) return;
    
    // Header
    document.getElementById('userName').textContent = STATE.user.userName || 'Troll';
    document.getElementById('userIdDisplay').textContent = `ID: ${(STATE.userId || '').slice(-8)}`;
    
    const avatar = document.getElementById('userAvatar');
    if (avatar) {
        avatar.textContent = STATE.user.premium ? '😏' : (STATE.user.avatar || '🧌');
    }
    
    // Balance
    const troll = STATE.user.balances?.TROLL || 0;
    document.getElementById('trollBalance').textContent = troll.toLocaleString();
    
    const usdValue = troll * CONFIG.TROLL_PRICE;
    document.getElementById('trollUsdValue').textContent = usdValue.toFixed(2);
    document.getElementById('totalBalance').textContent = `$${usdValue.toFixed(2)}`;
    
    // Referral stats
    document.getElementById('totalInvites').textContent = STATE.user.inviteCount || 0;
    document.getElementById('trollEarned').textContent = (STATE.user.referralEarnings || 0).toLocaleString();
    
    // Referral link
    const link = STATE.isGuest ? CONFIG.BOT_LINK : `${CONFIG.BOT_LINK}?startapp=${STATE.userId}`;
    document.getElementById('inviteLink').value = link;
    
    // Render page content
    if (STATE.currentPage === 'wallet') {
        renderAssets();
    } else if (STATE.currentPage === 'airdrop') {
        // Will be implemented
    }
}

function renderAssets() {
    const container = document.getElementById('assetsList');
    if (!container) return;
    
    const assets = [
        { symbol: 'TROLL', name: 'Troll Token', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/36313.png' },
        { symbol: 'SOL', name: 'Solana', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png' },
        { symbol: 'BNB', name: 'BNB', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png' }
    ];
    
    container.innerHTML = assets.map(asset => {
        const balance = STATE.user.balances?.[asset.symbol] || 0;
        return `
            <div class="asset-item">
                <div class="asset-left">
                    <img src="${asset.icon}" class="asset-icon-img" alt="${asset.symbol}">
                    <div class="asset-info">
                        <h4>${asset.name}</h4>
                        <p>${asset.symbol}</p>
                    </div>
                </div>
                <div class="asset-right">
                    <div class="asset-balance">${balance.toLocaleString()} ${asset.symbol}</div>
                </div>
            </div>
        `;
    }).join('');
}

function addAdminCrown() {
    const header = document.querySelector('.header-actions');
    if (!header || document.getElementById('adminCrownBtn')) return;
    
    const btn = document.createElement('button');
    btn.id = 'adminCrownBtn';
    btn.className = 'icon-btn';
    btn.innerHTML = '<i class="fas fa-crown" style="color: gold;"></i>';
    btn.onclick = () => showToast('Admin Panel', 'info');
    header.insertBefore(btn, header.firstChild);
}

// ====== 11. NAVIGATION ======
function showWallet() {
    STATE.currentPage = 'wallet';
    
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById('walletSection')?.classList.remove('hidden');
    
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector('[data-tab="wallet"]')?.classList.add('active');
    
    renderAssets();
}

function showAirdrop() {
    STATE.currentPage = 'airdrop';
    
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById('airdropSection')?.classList.remove('hidden');
    
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector('[data-tab="airdrop"]')?.classList.add('active');
    
    showToast('Missions coming soon!', 'info');
}

function showSettings() {
    STATE.currentPage = 'settings';
    
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById('settingsSection')?.classList.remove('hidden');
    
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector('[data-tab="settings"]')?.classList.add('active');
}

// ====== 12. ACTIONS ======
function copyInviteLink() {
    const link = document.getElementById('inviteLink');
    if (link) {
        navigator.clipboard?.writeText(link.value);
        showToast('Link copied!');
    }
}

function shareInviteLink() {
    const link = document.getElementById('inviteLink').value;
    const text = encodeURIComponent(`🧌 Join Troll Army! Get 1000 TROLL bonus!\n\n👉 ${link}`);
    
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=&text=${text}`);
    } else {
        showToast('Open in Telegram to share', 'error');
    }
}

function closeModal(id) {
    document.getElementById(id)?.classList.remove('show');
}

function showDepositModal() {
    document.getElementById('depositModal')?.classList.add('show');
}

function showWithdrawModal() {
    document.getElementById('withdrawModal')?.classList.add('show');
}

function logout() {
    if (confirm('Are you sure?')) {
        localStorage.clear();
        location.reload();
    }
}

function toggleTheme() {
    const theme = document.documentElement.getAttribute('data-theme');
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

function openSupport() {
    window.open('https://t.me/TrollSupport', '_blank');
}

// ====== 13. START ======
document.addEventListener('DOMContentLoaded', () => {
    // Set theme
    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    
    // Start app
    setTimeout(() => {
        initializeApp();
    }, 1000);
});

// ====== 14. EXPORTS ======
window.showWallet = showWallet;
window.showAirdrop = showAirdrop;
window.showSettings = showSettings;
window.copyInviteLink = copyInviteLink;
window.shareInviteLink = shareInviteLink;
window.closeModal = closeModal;
window.showDepositModal = showDepositModal;
window.showWithdrawModal = showWithdrawModal;
window.logout = logout;
window.toggleTheme = toggleTheme;
window.openSupport = openSupport;

log('✅ Troll Army script loaded');
