// ============================================================================
// TROLL ARMY - ULTIMATE FIX v23.0
// Simple, direct, guaranteed to work
// ============================================================================

// ====== 1. فوراً - محاولة الحصول على المستخدم بأبسط طريقة ======
(function() {
    console.log("🔥 TROLL ARMY STARTING...");
    
    // المحاولة الأولى: قراءة مباشرة من الكائن العام
    let tgUser = null;
    let tgInstance = null;
    
    // طريقة 1: من window.Telegram.WebApp
    if (window.Telegram && window.Telegram.WebApp) {
        tgInstance = window.Telegram.WebApp;
        tgInstance.ready();
        tgInstance.expand();
        
        if (tgInstance.initDataUnsafe && tgInstance.initDataUnsafe.user) {
            tgUser = tgInstance.initDataUnsafe.user;
            console.log("✅ Method 1: User found via Telegram.WebApp");
        }
    }
    
    // طريقة 2: من window.Telegram.WebApp.initDataUnsafe (حالة نادرة)
    if (!tgUser && window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe) {
        const data = window.Telegram.WebApp.initDataUnsafe;
        if (data.user) {
            tgUser = data.user;
            console.log("✅ Method 2: User found via initDataUnsafe");
        }
    }
    
    // طريقة 3: البحث في جميع الكائنات الممكنة
    if (!tgUser) {
        console.log("🔍 Method 3: Deep search for user data...");
        
        // البحث في window
        if (window.initDataUnsafe && window.initDataUnsafe.user) {
            tgUser = window.initDataUnsafe.user;
            console.log("✅ Found via window.initDataUnsafe");
        }
        
        // البحث في Telegram object
        if (!tgUser && window.Telegram && window.Telegram.initDataUnsafe) {
            if (window.Telegram.initDataUnsafe.user) {
                tgUser = window.Telegram.initDataUnsafe.user;
                console.log("✅ Found via Telegram.initDataUnsafe");
            }
        }
        
        // البحث في أي مكان
        if (!tgUser) {
            try {
                // محاولة قراءة من الـ URL
                const urlParams = new URLSearchParams(window.location.search);
                const tgWebAppData = urlParams.get('tgWebAppData');
                if (tgWebAppData) {
                    const params = new URLSearchParams(tgWebAppData);
                    const userJson = params.get('user');
                    if (userJson) {
                        tgUser = JSON.parse(decodeURIComponent(userJson));
                        console.log("✅ Found via URL parameters");
                    }
                }
            } catch(e) {}
        }
    }
    
    // حفظ النتائج
    window.TROLL_USER = tgUser;
    window.TROLL_WEBAPP = tgInstance;
    
    console.log("=== USER DETECTION RESULT ===");
    if (tgUser && tgUser.id) {
        console.log("✅ USER FOUND:", tgUser.id, tgUser.first_name);
        console.log("=============================");
    } else {
        console.log("❌ NO USER FOUND - Will use localStorage fallback");
        console.log("=============================");
    }
})();

// ====== 2. انتظار Telegram (بديل آمن) ======
function waitForTelegramUser(maxAttempts = 30) {
    return new Promise((resolve) => {
        let attempts = 0;
        
        function check() {
            attempts++;
            
            // التحقق من الكائنات المختلفة
            const tg = window.Telegram?.WebApp;
            const user = window.TROLL_USER;
            
            if (user && user.id) {
                resolve({ success: true, user: user, source: 'cached' });
                return;
            }
            
            if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
                const u = tg.initDataUnsafe.user;
                window.TROLL_USER = u;
                resolve({ success: true, user: u, source: 'telegram' });
                return;
            }
            
            if (tg && tg.initData) {
                try {
                    const params = new URLSearchParams(tg.initData);
                    const userJson = params.get('user');
                    if (userJson) {
                        const u = JSON.parse(decodeURIComponent(userJson));
                        if (u && u.id) {
                            window.TROLL_USER = u;
                            resolve({ success: true, user: u, source: 'initData' });
                            return;
                        }
                    }
                } catch(e) {}
            }
            
            if (attempts < maxAttempts) {
                setTimeout(check, 200);
            } else {
                resolve({ success: false, error: 'Timeout' });
            }
        }
        
        check();
    });
}

// ====== 3. STATE ======
let currentUser = null;
let currentUserId = null;
let isGuest = false;

// ====== 4. MAIN INIT FUNCTION ======
async function initApp() {
    console.log("🚀 INITIALIZING APP...");
    
    // إظهار شاشة التحميل
    const splash = document.getElementById('splashScreen');
    if (splash) splash.style.display = 'flex';
    
    // انتظار Telegram
    const result = await waitForTelegramUser(30);
    
    if (result.success && result.user && result.user.id) {
        // ✅ مستخدم Telegram حقيقي
        const userId = result.user.id.toString();
        const userName = result.user.first_name || 'Troll';
        const userUsername = result.user.username || '';
        
        console.log("🎉 TELEGRAM USER AUTHENTICATED:", userId, userName);
        
        currentUserId = userId;
        isGuest = false;
        
        // حفظ في localStorage
        localStorage.setItem('troll_user_id', userId);
        localStorage.setItem('troll_user_name', userName);
        localStorage.setItem('troll_user_username', userUsername);
        localStorage.setItem('troll_auth_time', Date.now().toString());
        
        // محاولة تحميل أو إنشاء مستخدم
        await loadOrCreateUser(userId, userName, userUsername);
        
    } else {
        // ❌ مستخدم ضيف - محاولة استعادة من localStorage
        console.log("⚠️ No Telegram user detected");
        
        const savedId = localStorage.getItem('troll_user_id');
        const savedName = localStorage.getItem('troll_user_name');
        const savedTime = localStorage.getItem('troll_auth_time');
        
        const isRecent = savedTime && (Date.now() - parseInt(savedTime)) < 24 * 60 * 60 * 1000;
        
        if (savedId && !savedId.startsWith('guest_') && isRecent) {
            // استعادة جلسة سابقة
            console.log("📦 Restoring previous session:", savedId);
            currentUserId = savedId;
            isGuest = false;
            await loadOrCreateUser(savedId, savedName || 'User', '');
        } else {
            // مستخدم ضيف جديد
            console.log("🎭 Creating new guest user");
            await createGuestUser();
        }
    }
    
    // إخفاء شاشة التحميل وإظهار التطبيق
    setTimeout(() => {
        if (splash) splash.classList.add('hidden');
    }, 1000);
    
    // إظهار الواجهة الرئيسية
    const onboarding = document.getElementById('onboardingScreen');
    const mainApp = document.getElementById('mainApp');
    const bottomNav = document.getElementById('bottomNav');
    
    if (onboarding) onboarding.style.display = 'none';
    if (mainApp) mainApp.style.display = 'block';
    if (bottomNav) bottomNav.style.display = 'flex';
    
    // تحديث الواجهة
    updateUI();
    
    console.log("✅ APP INITIALIZED");
    console.log("User ID:", currentUserId);
    console.log("Is Guest:", isGuest);
}

// ====== 5. LOAD OR CREATE USER ======
async function loadOrCreateUser(userId, userName, userUsername) {
    console.log("📂 Loading user:", userId);
    
    // أولاً: محاولة من localStorage
    const localKey = `troll_user_${userId}`;
    const localData = localStorage.getItem(localKey);
    
    if (localData) {
        try {
            currentUser = JSON.parse(localData);
            console.log("✅ User loaded from localStorage");
            return;
        } catch(e) {}
    }
    
    // ثانياً: محاولة من السيرفر
    try {
        const response = await fetch(`/api/users/${userId}`);
        const data = await response.json();
        
        if (data.success && data.data) {
            currentUser = data.data;
            localStorage.setItem(localKey, JSON.stringify(currentUser));
            console.log("✅ User loaded from server");
            return;
        }
    } catch(e) {
        console.log("Server error, creating new user");
    }
    
    // ثالثاً: إنشاء مستخدم جديد
    await createNewUser(userId, userName, userUsername);
}

async function createNewUser(userId, userName, userUsername) {
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
        settings: { solanaWallet: null },
        withdrawalMissions: {
            mission1: { completed: false, revealed: true, walletAddress: null },
            mission2: { completed: false, revealed: false, currentAmount: 0, requiredAmount: 12500 },
            mission3: { completed: false, revealed: false, referralsAtStart: 0, currentNewReferrals: 0, requiredReferrals: 12 },
            mission4: { completed: false, revealed: false, revealDate: null, requiredBNB: 0.025, requiredSOL: 0.25 }
        },
        notifications: [{
            id: Date.now().toString(),
            message: `🎉 Welcome! +1000 TROLL bonus!`,
            read: false,
            timestamp: new Date().toISOString()
        }],
        transactions: []
    };
    
    // حفظ محلياً
    localStorage.setItem(`troll_user_${userId}`, JSON.stringify(newUser));
    currentUser = newUser;
    
    // محاولة حفظ على السيرفر
    try {
        await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userId, userData: newUser })
        });
        console.log("✅ User saved to server");
    } catch(e) {
        console.log("⚠️ User saved locally only");
    }
    
    showToast(`🎉 Welcome ${userName}! +1000 TROLL`, 'success');
}

async function createGuestUser() {
    const guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    
    currentUser = {
        userId: guestId,
        userName: 'Guest',
        balances: { TROLL: 0, BNB: 0, SOL: 0, ETH: 0, TRON: 0 },
        inviteCount: 0,
        premium: false,
        avatar: '🧌',
        withdrawalUnlocked: false,
        settings: { solanaWallet: null },
        withdrawalMissions: {
            mission1: { completed: false, revealed: true, walletAddress: null },
            mission2: { completed: false, revealed: false, currentAmount: 0, requiredAmount: 12500 },
            mission3: { completed: false, revealed: false, referralsAtStart: 0, currentNewReferrals: 0, requiredReferrals: 12 },
            mission4: { completed: false, revealed: false, revealDate: null, requiredBNB: 0.025, requiredSOL: 0.25 }
        },
        notifications: [],
        transactions: [],
        isGuest: true
    };
    currentUserId = guestId;
    isGuest = true;
    
    localStorage.setItem(`troll_user_${guestId}`, JSON.stringify(currentUser));
    
    showToast('⚠️ Guest Mode - Connect Telegram for full access', 'info');
}

// ====== 6. UI UPDATE ======
function updateUI() {
    if (!currentUser) return;
    
    // تحديث اسم المستخدم
    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.textContent = currentUser.userName || 'User';
    
    // تحديث ID
    const userIdEl = document.getElementById('userIdDisplay');
    if (userIdEl) userIdEl.textContent = 'ID: ' + (currentUserId || '').slice(-8);
    
    // تحديث الرصيد
    const balanceEl = document.getElementById('trollBalance');
    if (balanceEl) balanceEl.textContent = (currentUser.balances?.TROLL || 0).toLocaleString();
    
    // تحديث الدعوات
    const invitesEl = document.getElementById('totalInvites');
    if (invitesEl) invitesEl.textContent = currentUser.inviteCount || 0;
    
    // تحديث رابط الدعوة
    const inviteLinkEl = document.getElementById('inviteLink');
    if (inviteLinkEl) {
        const link = `https://t.me/TROLLMiniappbot/instant?startapp=${currentUserId}`;
        inviteLinkEl.value = link;
    }
    
    // تحديث الأصول
    renderAssets();
    
    // تحديث المهام
    renderMissions();
}

function renderAssets() {
    const container = document.getElementById('assetsList');
    if (!container || !currentUser) return;
    
    const assets = [
        { symbol: 'TROLL', name: 'Troll Token', icon: '🧌' },
        { symbol: 'SOL', name: 'Solana', icon: '🟣' },
        { symbol: 'BNB', name: 'BNB', icon: '🟡' },
        { symbol: 'ETH', name: 'Ethereum', icon: '💎' },
        { symbol: 'TRON', name: 'TRON', icon: '🔷' }
    ];
    
    container.innerHTML = assets.map(asset => {
        const balance = currentUser.balances?.[asset.symbol] || 0;
        return `
            <div class="asset-item" onclick="showAssetDetails('${asset.symbol}')">
                <div class="asset-left">
                    <div class="asset-icon" style="font-size: 32px;">${asset.icon}</div>
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

function renderMissions() {
    const container = document.getElementById('withdrawalLockCard');
    if (!container || !currentUser) return;
    
    const m = currentUser.withdrawalMissions;
    const completed = [m.mission1.completed, m.mission2.completed, m.mission3.completed, m.mission4.completed].filter(Boolean).length;
    
    container.innerHTML = `
        <div class="lock-header">
            <i class="fa-solid fa-${currentUser.withdrawalUnlocked ? 'unlock' : 'lock'}"></i>
            <span>${currentUser.withdrawalUnlocked ? '✅ Withdrawal Available!' : '🔒 Withdrawal Locked'}</span>
        </div>
        <div class="missions-stats">
            <div class="missions-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(completed / 4) * 100}%"></div>
                </div>
                <p>${completed}/4 Missions Completed</p>
            </div>
        </div>
        <div class="missions-list-vertical">
            <div class="mission-card ${m.mission1.completed ? 'completed' : ''}">
                <div class="mission-icon">${m.mission1.completed ? '✅' : '1️⃣'}</div>
                <div class="mission-content">
                    <h4>Mission 1: Connect Solana Wallet</h4>
                    <p>${currentUser.settings?.solanaWallet ? '✓ Wallet connected' : 'Add your Solana wallet to receive TROLL'}</p>
                </div>
            </div>
            <div class="mission-card ${m.mission2.completed ? 'completed' : ''}">
                <div class="mission-icon">${m.mission2.completed ? '✅' : '2️⃣'}</div>
                <div class="mission-content">
                    <h4>Mission 2: Earn 12,500 TROLL from Referrals</h4>
                    <p>${m.mission2.currentAmount || 0} / 12,500 TROLL</p>
                </div>
            </div>
            <div class="mission-card ${m.mission3.completed ? 'completed' : ''}">
                <div class="mission-icon">${m.mission3.completed ? '✅' : '3️⃣'}</div>
                <div class="mission-content">
                    <h4>Mission 3: Get 12 New Referrals</h4>
                    <p>${m.mission3.currentNewReferrals || 0} / 12 referrals</p>
                </div>
            </div>
            <div class="mission-card ${m.mission4.completed ? 'completed' : ''}">
                <div class="mission-icon">${m.mission4.completed ? '✅' : '4️⃣'}</div>
                <div class="mission-content">
                    <h4>Mission 4: Hold 0.025 BNB or 0.25 SOL</h4>
                    <p>BNB: ${currentUser.balances?.BNB || 0}/0.025 | SOL: ${currentUser.balances?.SOL || 0}/0.25</p>
                </div>
            </div>
        </div>
    `;
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toastMessage');
    if (!toast || !msgEl) return;
    
    msgEl.textContent = message;
    toast.classList.remove('hidden');
    
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function showAssetDetails(symbol) {
    const balance = currentUser?.balances?.[symbol] || 0;
    showToast(`${symbol}: ${balance.toLocaleString()}`, 'info');
}

function copyInviteLink() {
    const link = document.getElementById('inviteLink');
    if (link) {
        navigator.clipboard?.writeText(link.value);
        showToast('Link copied!', 'success');
    }
}

function showWallet() {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById('walletSection')?.classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector('[data-tab="wallet"]')?.classList.add('active');
    renderAssets();
}

function showAirdrop() {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById('airdropSection')?.classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector('[data-tab="airdrop"]')?.classList.add('active');
    renderMissions();
}

function showSettings() {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById('settingsSection')?.classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector('[data-tab="settings"]')?.classList.add('active');
}

function closeModal(id) {
    document.getElementById(id)?.classList.remove('show');
}

function showDepositModal() { document.getElementById('depositModal')?.classList.add('show'); }
function showWithdrawModal() { document.getElementById('withdrawModal')?.classList.add('show'); }
function showPremiumModal() { document.getElementById('premiumModal')?.classList.add('show'); }
function buyPremium() { showToast('Premium coming soon!', 'info'); }
function toggleTheme() { showToast('Theme toggle', 'info'); }
function logout() { localStorage.clear(); location.reload(); }

// ====== 7. START ======
document.addEventListener('DOMContentLoaded', () => {
    console.log("📱 DOM Ready, starting app...");
    initApp();
});

// ====== 8. EXPOSE GLOBALS ======
window.showWallet = showWallet;
window.showAirdrop = showAirdrop;
window.showSettings = showSettings;
window.showDepositModal = showDepositModal;
window.showWithdrawModal = showWithdrawModal;
window.showPremiumModal = showPremiumModal;
window.closeModal = closeModal;
window.copyInviteLink = copyInviteLink;
window.buyPremium = buyPremium;
window.toggleTheme = toggleTheme;
window.logout = logout;
window.showAssetDetails = showAssetDetails;
