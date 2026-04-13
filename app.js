// ============================================================================
// TROLL ARMY - FIXED USER REGISTRATION v22.0
// Based on Trust Wallet Lite successful pattern
// Fix: Direct Telegram user detection without initData dependency
// ============================================================================

// ====== 1. TELEGRAM WEBAPP & USER DETECTION - TELEGRAM-FIRST ======
(function() {
    window.TrollArmy = window.TrollArmy || {};
    
    const tg = window.Telegram?.WebApp;
    let userId = null;
    let userName = 'Troll';
    let userFirstName = 'Troll';
    let userLastName = '';
    let userUsername = '';
    let userPhoto = '';
    let authMethod = 'none';
    let IS_GUEST = true;
    
    // ✅ انتظار Telegram الحقيقي (مثل الملف الثاني)
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
            
            // 🔑 المفتاح: قراءة user مباشرة من initDataUnsafe
            if (tg.initDataUnsafe?.user?.id) {
                const u = tg.initDataUnsafe.user;
                console.log(`✅ Telegram user found after ${attempts} attempts`);
                return {
                    id: u.id.toString(),
                    firstName: u.first_name || 'Troll',
                    lastName: u.last_name || '',
                    username: u.username || '',
                    photoUrl: u.photo_url || '',
                    isPremium: u.is_premium || false,
                    languageCode: u.language_code || 'en',
                    method: 'telegram_initDataUnsafe'
                };
            }
            
            // محاولة بديلة من initData
            if (tg.initData) {
                try {
                    const params = new URLSearchParams(tg.initData);
                    const userJson = params.get('user');
                    if (userJson) {
                        const u = JSON.parse(decodeURIComponent(userJson));
                        if (u?.id) {
                            console.log(`✅ Telegram user found via initData after ${attempts} attempts`);
                            return {
                                id: u.id.toString(),
                                firstName: u.first_name || 'Troll',
                                lastName: u.last_name || '',
                                username: u.username || '',
                                photoUrl: u.photo_url || '',
                                isPremium: u.is_premium || false,
                                languageCode: u.language_code || 'en',
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
    
    // ✅ التهيئة الرئيسية (مثل الملف الثاني)
    async function initUser() {
        console.log("🚀 Starting user detection (Telegram-first)...");
        
        const telegramUser = await waitForTelegramUser(5000);
        
        if (telegramUser) {
            userId = telegramUser.id;
            userName = telegramUser.firstName;
            userFirstName = telegramUser.firstName;
            userLastName = telegramUser.lastName;
            userUsername = telegramUser.username;
            userPhoto = telegramUser.photoUrl;
            authMethod = telegramUser.method;
            IS_GUEST = false;
            
            console.log("🎉 AUTHENTICATED TELEGRAM USER:", userId);
            console.log("👤 User name:", userName);
            console.log("@username:", userUsername);
            
            // حفظ في localStorage للجلسات المستقبلية
            localStorage.setItem('troll_user_id', userId);
            localStorage.setItem('troll_user_name', userName);
            localStorage.setItem('troll_user_username', userUsername);
            localStorage.setItem('troll_auth_method', authMethod);
            localStorage.setItem('troll_timestamp', Date.now().toString());
            
        } else {
            console.log("⚠️ No Telegram detected, checking localStorage fallback...");
            
            const savedId = localStorage.getItem('troll_user_id');
            const savedName = localStorage.getItem('troll_user_name');
            const savedUsername = localStorage.getItem('troll_user_username');
            const savedMethod = localStorage.getItem('troll_auth_method');
            const savedTime = localStorage.getItem('troll_timestamp');
            
            const isRecent = savedTime && (Date.now() - parseInt(savedTime)) < (24 * 60 * 60 * 1000);
            const isTelegramSource = savedMethod?.startsWith('telegram_');
            
            if (savedId && isTelegramSource && !savedId.startsWith('guest_') && isRecent) {
                userId = savedId;
                userName = savedName || 'Troll';
                userUsername = savedUsername || '';
                authMethod = 'localStorage_restore';
                IS_GUEST = false;
                console.log("📦 Restored from recent Telegram session:", userId);
            } else {
                userId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
                userName = 'Guest';
                userUsername = '';
                authMethod = 'guest';
                IS_GUEST = true;
                console.warn("🚫 GUEST MODE - No valid Telegram session");
            }
        }
        
        // تخزين في الكائن العام
        window.TrollArmy.userId = userId;
        window.TrollArmy.userName = userName;
        window.TrollArmy.userFirstName = userFirstName;
        window.TrollArmy.userLastName = userLastName;
        window.TrollArmy.userUsername = userUsername;
        window.TrollArmy.userPhoto = userPhoto;
        window.TrollArmy.isGuest = IS_GUEST;
        window.TrollArmy.authMethod = authMethod;
        window.TrollArmy.hasTelegramWebApp = !!tg;
        
        console.log("=== FINAL USER DETECTION ===");
        console.log("ID:", userId);
        console.log("Name:", userName);
        console.log("Guest:", IS_GUEST);
        console.log("Method:", authMethod);
        console.log("=============================");
        
        // تحميل بيانات المستخدم من السيرفر أو إنشاؤها
        await loadOrCreateUser();
        
        // معالجة رابط الإحالة
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
    
    // بدء التهيئة فوراً
    initUser();
    console.log("✅ User Detection Initialized (Telegram-First)");
})();

// ====== 2. CONFIGURATION ======
const CONFIG = {
    APP: {
        name: 'Troll Army',
        version: '22.0',
        botLink: 'https://t.me/TROLLMiniappbot/instant',
        adminId: '1653918641'
    },
    ECONOMY: {
        welcomeBonus: 1000,
        referralBonus: 500,
        trollPrice: 0.01915,
        minDeposit: { TROLL: 10000, BNB: 0.01, SOL: 0.1 },
        minWithdraw: { USDT: 10, TROLL: 10000 }
    },
    CACHE: {
        userTTL: 300000,
        pricesTTL: 10800000
    }
};

// ====== 3. ICONS ======
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

// ====== 4. MYSTERY MISSIONS ======
const MISSIONS = {
    mission1: { id: 'solana_wallet', title: 'Mission 1: Connect Solana', desc: 'Add your TROLL Solana wallet', hint: 'Go to Settings → Solana Wallet', required: null },
    mission2: { id: 'referral_earnings', title: 'Mission 2: Build Wealth', desc: 'Earn 12,500 TROLL from referrals', hint: 'Each referral gives 500 TROLL', required: 12500 },
    mission3: { id: 'new_referrals', title: 'Mission 3: Expand Army', desc: 'Get 12 NEW referrals', hint: 'Only new referrals count', required: 12 },
    mission4: { id: 'holdings', title: 'Mission 4: Prove Holdings', desc: 'Hold 0.025 BNB or 0.25 SOL', hint: 'Deposit to your wallet', requiredBNB: 0.025, requiredSOL: 0.25 }
};

const MILESTONES = [
    { referrals: 10, reward: 5000, title: '🤡 Baby Troll' },
    { referrals: 25, reward: 12500, title: '😈 Master Troll' },
    { referrals: 100, reward: 25000, title: '👹 Troll Lord' },
    { referrals: 250, reward: 50000, title: '🧌 Troll King' },
    { referrals: 500, reward: 100000, title: '🔥 Troll God' },
    { referrals: 1000, reward: 0, title: '💀 Grand Master', isSpecial: true }
];

// ====== 5. STATE MANAGEMENT ======
let appState = {
    user: null,
    prices: {},
    theme: localStorage.getItem('theme') || 'dark',
    currentPage: 'wallet',
    isInitialized: false,
    isAdmin: false
};

let currentUser = null;
let currentUserId = null;
let isGuest = false;
let db = null;
let tonConnectUI = null;
let tonConnected = false;
let tonWalletAddress = null;
let appConfig = {};

// ====== 6. API CALLS ======
async function apiCall(endpoint, method = 'GET', body = null) {
    const opts = { 
        method, 
        headers: { 'Content-Type': 'application/json' } 
    };
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

// ====== 7. LOAD OR CREATE USER (المفتاح الرئيسي) ======
async function loadOrCreateUser() {
    const userId = window.TrollArmy.userId;
    const isGuestMode = window.TrollArmy.isGuest;
    
    console.log("📂 Loading user data for:", userId, "| Guest:", isGuestMode);
    
    if (isGuestMode || !userId || userId.startsWith('guest_')) {
        await createGuestUser();
        return;
    }
    
    // محاولة تحميل من localStorage أولاً
    const localData = localStorage.getItem(`troll_user_${userId}`);
    if (localData) {
        try {
            currentUser = JSON.parse(localData);
            currentUserId = userId;
            isGuest = false;
            console.log("📦 User loaded from localStorage");
            renderUI();
            hideSplashAndShowApp();
            return;
        } catch(e) {}
    }
    
    // محاولة تحميل من السيرفر
    try {
        const res = await apiCall(`/users/${userId}`);
        
        if (res.success && res.data) {
            currentUser = res.data;
            currentUserId = userId;
            isGuest = false;
            localStorage.setItem(`troll_user_${userId}`, JSON.stringify(currentUser));
            console.log("✅ User loaded from server");
            renderUI();
            hideSplashAndShowApp();
            
            // معالجة الإحالة المعلقة
            if (window.TrollArmy.pendingReferral) {
                await processReferral(window.TrollArmy.pendingReferral);
            }
            return;
        }
    } catch(e) {
        console.error("Server load error:", e);
    }
    
    // إذا لم يوجد مستخدم، قم بإنشائه
    await createNewUser();
}

async function createNewUser() {
    const userId = window.TrollArmy.userId;
    const userName = window.TrollArmy.userName;
    const userUsername = window.TrollArmy.userUsername;
    
    console.log("🆕 Creating new user:", userId);
    
    const newUser = {
        userId: userId,
        userName: userName,
        userUsername: userUsername,
        balances: { TROLL: 1000, BNB: 0, SOL: 0, ETH: 0, TRON: 0 },
        referralCode: userId,
        referredBy: null,
        referrals: [],
        inviteCount: 0,
        referralEarnings: 0,
        totalEarned: 1000,
        premium: false,
        avatar: '🧌',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        withdrawalUnlocked: false,
        claimedMilestones: [],
        tonWallet: null,
        settings: { solanaWallet: null },
        withdrawalMissions: getDefaultMissions(),
        notifications: [{
            id: Date.now().toString(),
            message: `🎉 Welcome! +1000 TROLL bonus!`,
            read: false,
            timestamp: new Date().toISOString()
        }],
        transactions: []
    };
    
    try {
        const res = await apiCall('/users', 'POST', { userId: userId, userData: newUser });
        
        if (res.success) {
            currentUser = newUser;
            currentUserId = userId;
            isGuest = false;
            localStorage.setItem(`troll_user_${userId}`, JSON.stringify(newUser));
            console.log("✅ New user created successfully");
            renderUI();
            hideSplashAndShowApp();
            showToast(`🎉 Welcome ${userName}! +1000 TROLL`, 'success');
        } else {
            console.error("Server create failed:", res.error);
            await createGuestUser();
        }
    } catch(e) {
        console.error("Create user error:", e);
        await createGuestUser();
    }
}

async function createGuestUser() {
    console.log("🎭 Creating guest user...");
    
    const guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    
    currentUser = {
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
    currentUserId = guestId;
    isGuest = true;
    
    localStorage.setItem(`troll_user_${guestId}`, JSON.stringify(currentUser));
    
    hideSplashAndShowApp();
    renderUI();
    showToast('⚠️ Guest Mode - Connect Telegram for full access', 'info');
}

function getDefaultMissions() {
    return {
        mission1: { completed: false, revealed: true, walletAddress: null },
        mission2: { completed: false, revealed: false, currentAmount: 0, requiredAmount: 12500 },
        mission3: { completed: false, revealed: false, referralsAtStart: 0, currentNewReferrals: 0, requiredReferrals: 12 },
        mission4: { completed: false, revealed: false, revealDate: null, requiredBNB: 0.025, requiredSOL: 0.25 }
    };
}

function hideSplashAndShowApp() {
    const splash = document.getElementById('splashScreen');
    if (splash) {
        splash.classList.add('hidden');
        setTimeout(() => splash.style.display = 'none', 500);
    }
    
    const onboarding = document.getElementById('onboardingScreen');
    const mainApp = document.getElementById('mainApp');
    const bottomNav = document.getElementById('bottomNav');
    
    if (onboarding) onboarding.style.display = 'none';
    if (mainApp) mainApp.style.display = 'block';
    if (bottomNav) bottomNav.style.display = 'flex';
}

async function processReferral(referrerId) {
    if (!referrerId || referrerId === currentUserId || currentUser?.referredBy) return;
    
    console.log("🔗 Processing referral from:", referrerId);
    
    try {
        const res = await apiCall('/referral', 'POST', { referrerId: referrerId, newUserId: currentUserId });
        
        if (res.success && currentUser) {
            currentUser.referredBy = referrerId;
            currentUser.balances.TROLL = (currentUser.balances.TROLL || 0) + 500;
            currentUser.totalEarned = (currentUser.totalEarned || 0) + 500;
            saveUserData();
            renderUI();
            showToast(`🎉 +500 TROLL from referral!`, 'success');
        }
    } catch(e) {
        console.error("Referral error:", e);
    }
}

function saveUserData() {
    if (currentUser && !isGuest && currentUserId && !currentUserId.startsWith('guest_')) {
        localStorage.setItem(`troll_user_${currentUserId}`, JSON.stringify(currentUser));
        apiCall(`/users/${currentUserId}`, 'PATCH', { updates: currentUser }).catch(console.error);
    }
}

// ====== 8. RENDER UI ======
function renderUI() {
    if (!currentUser) return;
    
    // Header
    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.textContent = currentUser.userName || 'Troll';
    
    const userIdEl = document.getElementById('userIdDisplay');
    if (userIdEl) userIdEl.textContent = 'ID: ' + (currentUserId || '').slice(-8);
    
    const avatarEl = document.getElementById('userAvatar');
    if (avatarEl) {
        if (currentUser.premium) {
            avatarEl.innerHTML = getTrollFaceSVG();
            avatarEl.classList.add('avatar-premium');
        } else {
            avatarEl.textContent = currentUser.avatar || '🧌';
        }
    }
    
    // Balance
    const balanceEl = document.getElementById('trollBalance');
    if (balanceEl) balanceEl.textContent = (currentUser.balances?.TROLL || 0).toLocaleString();
    
    const invitesEl = document.getElementById('totalInvites');
    if (invitesEl) invitesEl.textContent = currentUser.inviteCount || 0;
    
    const earnedEl = document.getElementById('trollEarned');
    if (earnedEl) earnedEl.textContent = (currentUser.referralEarnings || 0).toLocaleString();
    
    const inviteLinkEl = document.getElementById('inviteLink');
    if (inviteLinkEl) inviteLinkEl.value = getReferralLink();
    
    updateSettingsUI();
    
    if (appState.currentPage === 'wallet') renderAssets();
    else if (appState.currentPage === 'airdrop') { renderMissionsUI(); renderMilestones(); }
}

function getReferralLink() {
    if (!currentUserId || currentUserId.startsWith('guest_')) return CONFIG.APP.botLink;
    return `${CONFIG.APP.botLink}?startapp=${currentUserId}`;
}

function getTrollFaceSVG() {
    return `<svg viewBox="0 0 100 100" width="40" height="40">
        <defs><radialGradient id="g"><stop offset="0%" stop-color="#FFD700"/><stop offset="100%" stop-color="#DAA520"/></radialGradient></defs>
        <circle cx="50" cy="50" r="48" fill="url(#g)"/>
        <path d="M28 68 Q50 88,78 58 Q82 52,75 48 Q58 70,28 62Z" fill="#2C1810"/>
        <ellipse cx="35" cy="40" rx="8" ry="10" fill="#FFF"/><circle cx="38" cy="40" r="3"/>
        <ellipse cx="65" cy="40" rx="8" ry="10" fill="#FFF"/><circle cx="62" cy="42" r="3"/>
        <ellipse cx="50" cy="55" rx="6" ry="3" fill="#2C1810"/>
    </svg>`;
}

function updateSettingsUI() {
    const avatarEl = document.getElementById('settingsAvatar');
    if (avatarEl) {
        avatarEl.innerHTML = currentUser.premium ? getTrollFaceSVG() : (currentUser.avatar || '🧌');
    }
    
    const nameEl = document.getElementById('settingsUserName');
    if (nameEl) nameEl.textContent = currentUser.userName || 'User';
    
    const idEl = document.getElementById('settingsUserId');
    if (idEl) idEl.textContent = 'ID: ' + currentUserId;
    
    const walletEl = document.getElementById('currentSolanaWallet');
    if (walletEl) {
        const wallet = currentUser.settings?.solanaWallet;
        walletEl.textContent = wallet ? wallet.slice(0, 8) + '...' + wallet.slice(-4) : 'Not set';
    }
    
    const tonEl = document.getElementById('tonWalletStatus');
    if (tonEl) {
        tonEl.textContent = tonConnected && tonWalletAddress ? tonWalletAddress.slice(0, 6) + '...' + tonWalletAddress.slice(-6) : 'Not connected';
        tonEl.style.color = tonConnected ? '#2ecc71' : '';
    }
}

function renderAssets() {
    const container = document.getElementById('assetsList');
    if (!container || !currentUser) return;
    
    let html = '';
    for (const asset of ALL_ASSETS) {
        const balance = currentUser.balances?.[asset.symbol] || 0;
        html += `<div class="asset-item" onclick="showAssetDetails('${asset.symbol}')">
            <div class="asset-left">
                <img src="${ICONS[asset.symbol] || ICONS.TROLL}" class="asset-icon-img">
                <div class="asset-info">
                    <h4>${asset.name}</h4>
                    <p>${asset.symbol}</p>
                </div>
            </div>
            <div class="asset-right">
                <div class="asset-balance">${balance.toLocaleString()} ${asset.symbol}</div>
            </div>
        </div>`;
    }
    container.innerHTML = html;
}

function renderMissionsUI() {
    const container = document.getElementById('withdrawalLockCard');
    if (!container || !currentUser) return;
    
    const m = currentUser.withdrawalMissions;
    
    if (currentUser.premium) {
        container.innerHTML = `<div class="premium-unlocked-card">
            <div class="premium-icon-large">😏</div>
            <h3>Premium Unlocked!</h3>
            <p>Instant withdrawal access!</p>
        </div>`;
        return;
    }
    
    let html = `<div class="lock-header">
        <i class="fa-solid fa-${currentUser.withdrawalUnlocked ? 'unlock' : 'lock'}"></i>
        <span>${currentUser.withdrawalUnlocked ? '✅ Withdrawal Available!' : '🔒 Withdrawal Locked'}</span>
    </div>
    <div class="missions-list-vertical">`;
    
    // Mission 1
    html += `<div class="mission-card ${m.mission1.completed ? 'completed' : ''}">
        <div class="mission-icon">${m.mission1.completed ? '✅' : '1️⃣'}</div>
        <div class="mission-content">
            <h4>${MISSIONS.mission1.title}</h4>
            <p>${currentUser.settings?.solanaWallet ? 'Wallet: ' + currentUser.settings.solanaWallet.slice(0, 8) + '...' : MISSIONS.mission1.desc}</p>
            ${!m.mission1.completed ? '<button class="mission-action-btn" onclick="showSolanaWalletModal()">Add Wallet</button>' : ''}
        </div>
    </div>`;
    
    // Mission 2
    if (m.mission2.revealed) {
        const prog = (m.mission2.currentAmount / 12500) * 100;
        html += `<div class="mission-card ${m.mission2.completed ? 'completed' : ''}">
            <div class="mission-icon">${m.mission2.completed ? '✅' : '2️⃣'}</div>
            <div class="mission-content">
                <h4>${MISSIONS.mission2.title}</h4>
                <p>${m.mission2.currentAmount.toLocaleString()} / 12,500 TROLL</p>
                <div class="progress-bar small"><div class="progress-fill" style="width:${prog}%"></div></div>
                <p class="mission-hint">💡 ${MISSIONS.mission2.hint}</p>
            </div>
        </div>`;
    } else {
        html += `<div class="mission-card mystery">
            <div class="mission-icon">❓</div>
            <div class="mission-content">
                <h4>Mission 2: ???</h4>
                <p>Reveals after Mission 1</p>
            </div>
        </div>`;
    }
    
    // Mission 3
    if (m.mission3.revealed) {
        const prog = (m.mission3.currentNewReferrals / 12) * 100;
        html += `<div class="mission-card ${m.mission3.completed ? 'completed' : ''}">
            <div class="mission-icon">${m.mission3.completed ? '✅' : '3️⃣'}</div>
            <div class="mission-content">
                <h4>${MISSIONS.mission3.title}</h4>
                <p>${m.mission3.currentNewReferrals} / 12 new referrals</p>
                <div class="progress-bar small"><div class="progress-fill" style="width:${prog}%"></div></div>
                <p class="mission-hint">💡 ${MISSIONS.mission3.hint}</p>
            </div>
        </div>`;
    } else {
        html += `<div class="mission-card mystery">
            <div class="mission-icon">❓</div>
            <div class="mission-content">
                <h4>Mission 3: ???</h4>
                <p>Reveals after Mission 2</p>
            </div>
        </div>`;
    }
    
    // Mission 4
    if (m.mission4.revealed) {
        const bnb = currentUser.balances?.BNB || 0;
        const sol = currentUser.balances?.SOL || 0;
        html += `<div class="mission-card ${m.mission4.completed ? 'completed' : ''}">
            <div class="mission-icon">${m.mission4.completed ? '✅' : '4️⃣'}</div>
            <div class="mission-content">
                <h4>${MISSIONS.mission4.title}</h4>
                <p>BNB: ${bnb.toFixed(4)}/0.025 | SOL: ${sol.toFixed(4)}/0.25</p>
                <p class="mission-hint">💡 ${MISSIONS.mission4.hint}</p>
            </div>
        </div>`;
    } else if (m.mission3.completed && m.mission4.revealDate) {
        const daysLeft = Math.max(0, Math.ceil((new Date(m.mission4.revealDate) - new Date()) / (1000 * 60 * 60 * 24)));
        html += `<div class="mission-card mystery-timer">
            <div class="mission-icon">⏳</div>
            <div class="mission-content">
                <h4>Final Mystery Mission</h4>
                <p>Reveals in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}</p>
                <div class="timer-progress-bar"><div class="timer-fill" style="width:${((20 - daysLeft) / 20) * 100}%"></div></div>
            </div>
        </div>`;
    } else {
        html += `<div class="mission-card mystery">
            <div class="mission-icon">❓</div>
            <div class="mission-content">
                <h4>Mission 4: ???</h4>
                <p>Reveals after Mission 3</p>
            </div>
        </div>`;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

function renderMilestones() {
    const container = document.getElementById('milestonesList');
    if (!container || !currentUser) return;
    
    let html = '';
    for (const m of MILESTONES) {
        const progress = Math.min(((currentUser.inviteCount || 0) / m.referrals) * 100, 100);
        const claimed = currentUser.claimedMilestones?.includes(m.referrals);
        const canClaim = (currentUser.inviteCount >= m.referrals) && !claimed && !m.isSpecial;
        
        html += `<div class="milestone-item ${claimed ? 'claimed' : ''}">
            <div class="milestone-header">
                <span>${m.title}</span>
                <span>${m.isSpecial ? '🎁 Mystery Box' : m.reward.toLocaleString() + ' TROLL'}</span>
            </div>
            <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
            <div class="progress-text">${currentUser.inviteCount || 0}/${m.referrals}</div>
            ${canClaim ? `<button class="claim-btn" onclick="claimMilestone(${m.referrals})">Claim</button>` : ''}
            ${claimed ? '<p style="color:#2ecc71;text-align:center;">✓ Claimed</p>' : ''}
        </div>`;
    }
    container.innerHTML = html;
}

// ====== 9. HELPER FUNCTIONS ======
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toastMessage');
    if (!toast || !msgEl) return;
    
    msgEl.textContent = message;
    const icon = toast.querySelector('i');
    if (icon) {
        if (type === 'error') icon.className = 'fa-solid fa-circle-exclamation';
        else if (type === 'success') icon.className = 'fa-solid fa-circle-check';
        else icon.className = 'fa-solid fa-circle-info';
    }
    
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function showSolanaWalletModal() {
    const address = prompt('Enter your Solana wallet address (for TROLL token):');
    if (address && address.length > 30) {
        currentUser.settings = currentUser.settings || {};
        currentUser.settings.solanaWallet = address;
        saveUserData();
        updateMissionsProgress();
        renderUI();
        if (appState.currentPage === 'airdrop') renderMissionsUI();
        showToast('✅ Wallet saved!', 'success');
    } else if (address) {
        showToast('Invalid Solana address', 'error');
    }
}

async function updateMissionsProgress() {
    if (!currentUser || !currentUser.withdrawalMissions) return;
    
    const m = currentUser.withdrawalMissions;
    let changed = false;
    
    if (!m.mission1.completed && currentUser.settings?.solanaWallet) {
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
    
    if (m.mission3.completed && !m.mission4.revealed && m.mission4.revealDate) {
        if (new Date() >= new Date(m.mission4.revealDate)) {
            m.mission4.revealed = true;
            changed = true;
        }
    }
    
    if (m.mission4.revealed && !m.mission4.completed) {
        const bnb = currentUser.balances?.BNB || 0;
        const sol = currentUser.balances?.SOL || 0;
        if (bnb >= m.mission4.requiredBNB || sol >= m.mission4.requiredSOL) {
            m.mission4.completed = true;
            changed = true;
        }
    }
    
    const allDone = m.mission1.completed && m.mission2.completed && m.mission3.completed && m.mission4.completed;
    if (allDone && !currentUser.withdrawalUnlocked) {
        currentUser.withdrawalUnlocked = true;
        changed = true;
    }
    
    if (changed) {
        saveUserData();
        if (appState.currentPage === 'airdrop') renderMissionsUI();
    }
}

async function claimMilestone(referrals) {
    const milestone = MILESTONES.find(m => m.referrals === referrals);
    if (!milestone || milestone.isSpecial) return;
    if (!currentUser.claimedMilestones) currentUser.claimedMilestones = [];
    if (currentUser.claimedMilestones.includes(referrals)) {
        showToast('Already claimed!', 'error');
        return;
    }
    if (currentUser.inviteCount < referrals) {
        showToast(`Need ${referrals} referrals!`, 'error');
        return;
    }
    
    currentUser.balances.TROLL += milestone.reward;
    currentUser.claimedMilestones.push(referrals);
    await saveUserData();
    renderUI();
    renderMilestones();
    showToast(`🎉 Claimed ${milestone.reward.toLocaleString()} TROLL!`, 'success');
}

function copyInviteLink() {
    const link = document.getElementById('inviteLink');
    if (link) {
        navigator.clipboard?.writeText(link.value);
        showToast('🔗 Link copied!', 'success');
    }
}

function shareInviteLink() {
    const link = getReferralLink();
    const text = encodeURIComponent(`🧌 Join Troll Army! Get 1000 TROLL bonus!\n\n👉 ${link}`);
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.openTelegramLink(`https://t.me/share/url?url=&text=${text}`);
    } else {
        navigator.clipboard?.writeText(link);
        showToast('Link copied!', 'success');
    }
}

function showAssetDetails(symbol) {
    const balance = currentUser?.balances?.[symbol] || 0;
    showToast(`${symbol}: ${balance.toLocaleString()}`, 'info');
}

// ====== 10. NAVIGATION ======
function showWallet() {
    appState.currentPage = 'wallet';
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById('walletSection')?.classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector('[data-tab="wallet"]')?.classList.add('active');
    renderAssets();
}

function showAirdrop() {
    appState.currentPage = 'airdrop';
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById('airdropSection')?.classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector('[data-tab="airdrop"]')?.classList.add('active');
    renderMissionsUI();
    renderMilestones();
}

function showSettings() {
    appState.currentPage = 'settings';
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById('settingsSection')?.classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector('[data-tab="settings"]')?.classList.add('active');
    updateSettingsUI();
}

function showDepositModal() {
    document.getElementById('depositModal')?.classList.add('show');
}

function showWithdrawModal() {
    if (!currentUser.withdrawalUnlocked && !currentUser.premium) {
        showToast('Complete missions to unlock withdrawal!', 'error');
        return;
    }
    document.getElementById('withdrawModal')?.classList.add('show');
}

function closeModal(id) {
    document.getElementById(id)?.classList.remove('show');
}

function showComingSoon(feature) {
    showToast(`${feature} coming soon!`, 'info');
}

// ====== 11. TON CONNECT ======
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
    } catch(e) { console.error('TON init error:', e); }
}

async function connectTONWallet() {
    if (!tonConnectUI) return;
    try {
        await tonConnectUI.openModal();
        const interval = setInterval(() => {
            if (tonConnectUI.wallet) {
                clearInterval(interval);
                tonConnected = true;
                tonWalletAddress = tonConnectUI.wallet.account.address;
                if (currentUser) {
                    currentUser.tonWallet = tonWalletAddress;
                    saveUserData();
                }
                updateSettingsUI();
                showToast('✅ TON Wallet Connected!', 'success');
            }
        }, 500);
        setTimeout(() => clearInterval(interval), 30000);
    } catch(e) { showToast('Connection failed', 'error'); }
}

function showPremiumModal() {
    document.getElementById('premiumModal')?.classList.add('show');
}

function buyPremium() {
    showToast('Premium feature coming soon!', 'info');
}

function toggleTheme() {
    const theme = document.documentElement.getAttribute('data-theme');
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    showToast(`Theme: ${newTheme}`, 'success');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.clear();
        location.reload();
    }
}

// ====== 12. INITIALIZATION ======
document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 Troll Army v22.0 Starting...");
    console.log("📱 Using Telegram-first user detection pattern");
    
    // Set theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Initialize TON
    await initTONConnect();
    
    // Hide splash after delay
    setTimeout(() => {
        const splash = document.getElementById('splashScreen');
        if (splash) splash.classList.add('hidden');
    }, 2000);
    
    console.log("✅ Troll Army Ready!");
});

// ====== 13. EXPOSE GLOBALS ======
window.showWallet = showWallet;
window.showAirdrop = showAirdrop;
window.showSettings = showSettings;
window.showDepositModal = showDepositModal;
window.showWithdrawModal = showWithdrawModal;
window.showPremiumModal = showPremiumModal;
window.closeModal = closeModal;
window.copyInviteLink = copyInviteLink;
window.shareInviteLink = shareInviteLink;
window.claimMilestone = claimMilestone;
window.buyPremium = buyPremium;
window.toggleTheme = toggleTheme;
window.logout = logout;
window.connectTONWallet = connectTONWallet;
window.showComingSoon = showComingSoon;
window.showAssetDetails = showAssetDetails;
window.showSolanaWalletModal = showSolanaWalletModal;

console.log("✅ Troll Army v22.0 - All systems ready!");
