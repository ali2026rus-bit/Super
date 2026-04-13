// ============================================================================
// TROLL ARMY - PROFESSIONAL EDITION v24.0
// ============================================================================
// ✅ FIX: Telegram detection with multiple fallback methods
// ✅ FIX: User registration in Firebase
// ✅ FIX: Guest mode fallback
// ============================================================================

// ============================================================================
// 1. FORCE TELEGRAM DETECTION - MUST RUN FIRST
// ============================================================================

(function() {
    console.log("🚀 TROLL ARMY - FORCED TELEGRAM DETECTION");
    console.log("⏰ Time:", new Date().toISOString());
    
    // متغيرات عامة
    window.TROLL_ARMY = window.TROLL_ARMY || {};
    window.TROLL_ARMY.isTelegram = false;
    window.TROLL_ARMY.userId = null;
    window.TROLL_ARMY.userName = null;
    window.TROLL_ARMY.userUsername = null;
    window.TROLL_ARMY.isReady = false;
    
    // ====== الطريقة 1: قراءة مباشرة من window ======
    function checkDirect() {
        if (window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            if (tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.id) {
                const user = tg.initDataUnsafe.user;
                window.TROLL_ARMY.isTelegram = true;
                window.TROLL_ARMY.userId = user.id.toString();
                window.TROLL_ARMY.userName = user.first_name || 'Troll';
                window.TROLL_ARMY.userUsername = user.username || '';
                window.TROLL_ARMY.telegramInstance = tg;
                
                tg.ready();
                tg.expand();
                
                console.log("✅✅✅ TELEGRAM DETECTED (Method 1)");
                console.log("📱 User ID:", window.TROLL_ARMY.userId);
                console.log("📱 User Name:", window.TROLL_ARMY.userName);
                
                return true;
            }
        }
        return false;
    }
    
    // ====== الطريقة 2: انتظار تحميل Telegram ======
    let attempts = 0;
    const maxAttempts = 50; // 5 ثواني (100ms * 50)
    
    function waitForTelegram() {
        attempts++;
        
        // محاولة القراءة المباشرة أولاً
        if (checkDirect()) {
            window.TROLL_ARMY.isReady = true;
            dispatchReadyEvent();
            return;
        }
        
        // محاولة بديلة: البحث في window.Telegram
        if (window.Telegram) {
            console.log(`🔄 Attempt ${attempts}: Telegram object exists, checking WebApp...`);
            
            if (window.Telegram.WebApp) {
                console.log(`🔄 Attempt ${attempts}: WebApp exists, checking user...`);
                const tg = window.Telegram.WebApp;
                
                if (tg.initDataUnsafe) {
                    console.log(`🔄 Attempt ${attempts}: initDataUnsafe exists`);
                    
                    if (tg.initDataUnsafe.user) {
                        const user = tg.initDataUnsafe.user;
                        if (user.id) {
                            window.TROLL_ARMY.isTelegram = true;
                            window.TROLL_ARMY.userId = user.id.toString();
                            window.TROLL_ARMY.userName = user.first_name || 'Troll';
                            window.TROLL_ARMY.userUsername = user.username || '';
                            window.TROLL_ARMY.telegramInstance = tg;
                            
                            tg.ready();
                            tg.expand();
                            
                            console.log("✅✅✅ TELEGRAM DETECTED (Method 2)");
                            console.log("📱 User ID:", window.TROLL_ARMY.userId);
                            
                            window.TROLL_ARMY.isReady = true;
                            dispatchReadyEvent();
                            return;
                        }
                    }
                }
            }
        }
        
        // محاولة بديلة: قراءة من sessionStorage أو localStorage
        if (attempts === 10) {
            try {
                const savedId = localStorage.getItem('troll_telegram_id');
                const savedName = localStorage.getItem('troll_telegram_name');
                if (savedId && savedName) {
                    window.TROLL_ARMY.isTelegram = true;
                    window.TROLL_ARMY.userId = savedId;
                    window.TROLL_ARMY.userName = savedName;
                    window.TROLL_ARMY.isRestored = true;
                    console.log("📦 RESTORED from localStorage:", savedId);
                    window.TROLL_ARMY.isReady = true;
                    dispatchReadyEvent();
                    return;
                }
            } catch(e) {}
        }
        
        // استمرار الانتظار
        if (attempts < maxAttempts) {
            setTimeout(waitForTelegram, 100);
        } else {
            console.log("❌❌❌ TELEGRAM NOT DETECTED - Using Guest Mode");
            window.TROLL_ARMY.isTelegram = false;
            window.TROLL_ARMY.isReady = true;
            dispatchReadyEvent();
        }
    }
    
    function dispatchReadyEvent() {
        const event = new CustomEvent('troll-army-ready', {
            detail: {
                isTelegram: window.TROLL_ARMY.isTelegram,
                userId: window.TROLL_ARMY.userId,
                userName: window.TROLL_ARMY.userName
            }
        });
        window.dispatchEvent(event);
        console.log("📢 Event 'troll-army-ready' dispatched");
    }
    
    // بدء عملية الكشف
    waitForTelegram();
    
    // محاولة فورية إضافية بعد 500ms
    setTimeout(() => {
        if (!window.TROLL_ARMY.isReady) {
            console.log("🔄 Extra attempt after 500ms...");
            checkDirect();
        }
    }, 500);
    
    console.log("🔍 Telegram detection started...");
})();

// ============================================================================
// 2. WAIT FOR TELEGRAM DETECTION THEN INITIALIZE
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log("📄 DOM Content Loaded");
    
    // إخفاء splash بعد 2 ثانية كحد أقصى
    setTimeout(() => {
        const splash = document.getElementById('splashScreen');
        if (splash && splash.style.display !== 'none') {
            splash.classList.add('hidden');
        }
    }, 3000);
    
    // انتظار اكتشاف Telegram
    if (window.TROLL_ARMY && window.TROLL_ARMY.isReady) {
        initializeApp();
    } else {
        window.addEventListener('troll-army-ready', () => {
            initializeApp();
        });
    }
});

// ============================================================================
// 3. MAIN APPLICATION INITIALIZATION
// ============================================================================

let currentUser = null;
let currentUserId = null;
let isGuest = false;

async function initializeApp() {
    console.log("🚀 INITIALIZING APP...");
    console.log("📱 Telegram detected:", window.TROLL_ARMY.isTelegram);
    console.log("📱 User ID:", window.TROLL_ARMY.userId);
    console.log("📱 User Name:", window.TROLL_ARMY.userName);
    
    // إخفاء شاشة التحميل
    const splash = document.getElementById('splashScreen');
    if (splash) {
        splash.classList.add('hidden');
        setTimeout(() => splash.style.display = 'none', 500);
    }
    
    if (window.TROLL_ARMY.isTelegram && window.TROLL_ARMY.userId) {
        // ✅ مستخدم Telegram حقيقي
        currentUserId = window.TROLL_ARMY.userId;
        isGuest = false;
        
        // حفظ في localStorage للجلسات المستقبلية
        localStorage.setItem('troll_telegram_id', currentUserId);
        localStorage.setItem('troll_telegram_name', window.TROLL_ARMY.userName);
        localStorage.setItem('troll_auth_time', Date.now().toString());
        
        console.log("🎉 TELEGRAM USER AUTHENTICATED:", currentUserId);
        
        // تحميل أو إنشاء المستخدم
        await loadOrCreateUser();
        
        // إظهار واجهة المستخدم الرئيسية
        showMainApp();
        
        // تحديث الواجهة
        updateUI();
        
        // عرض رسالة ترحيب للمستخدم الجديد
        if (window.TROLL_ARMY.isNewUser) {
            showToast(`🎉 Welcome ${window.TROLL_ARMY.userName}! +1000 TROLL`, 'success');
        }
        
    } else {
        // ❌ وضع الضيف
        console.log("🎭 GUEST MODE - No Telegram detected");
        await createGuestUser();
        showMainApp();
        updateUI();
        showToast('⚠️ Guest Mode - Open from Telegram for full features', 'warning');
    }
}

// ============================================================================
// 4. LOAD OR CREATE USER IN FIREBASE
// ============================================================================

async function loadOrCreateUser() {
    if (!currentUserId) return;
    
    console.log("📂 Loading/Creating user:", currentUserId);
    
    // محاولة تحميل من localStorage أولاً
    const localKey = `troll_user_${currentUserId}`;
    const localData = localStorage.getItem(localKey);
    
    if (localData) {
        try {
            currentUser = JSON.parse(localData);
            console.log("✅ User loaded from localStorage");
            return;
        } catch(e) {}
    }
    
    // محاولة تحميل من السيرفر
    try {
        const response = await fetch(`/api/users/${currentUserId}`);
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
    
    // إنشاء مستخدم جديد
    await createNewUser();
}

async function createNewUser() {
    console.log("🆕 Creating new user:", currentUserId);
    
    const newUser = {
        userId: currentUserId,
        userName: window.TROLL_ARMY.userName || 'Troll',
        userUsername: window.TROLL_ARMY.userUsername || '',
        balances: { TROLL: 1000, BNB: 0, SOL: 0, ETH: 0, TRON: 0 },
        referralCode: currentUserId,
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
        withdrawalMissions: getDefaultMissions(),
        notifications: [{
            id: Date.now().toString(),
            message: `🎉 Welcome! +1000 TROLL bonus!`,
            read: false,
            timestamp: new Date().toISOString()
        }],
        transactions: []
    };
    
    // حفظ محلياً
    localStorage.setItem(`troll_user_${currentUserId}`, JSON.stringify(newUser));
    currentUser = newUser;
    
    // محاولة حفظ على السيرفر
    try {
        await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUserId, userData: newUser })
        });
        console.log("✅ User saved to server");
        window.TROLL_ARMY.isNewUser = true;
    } catch(e) {
        console.log("⚠️ User saved locally only");
    }
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
        withdrawalMissions: getDefaultMissions(),
        notifications: [],
        transactions: [],
        isGuest: true
    };
    currentUserId = guestId;
    isGuest = true;
    
    localStorage.setItem(`troll_user_${guestId}`, JSON.stringify(currentUser));
}

function getDefaultMissions() {
    return {
        mission1: { completed: false, revealed: true, walletAddress: null },
        mission2: { completed: false, revealed: false, currentAmount: 0, requiredAmount: 12500 },
        mission3: { completed: false, revealed: false, referralsAtStart: 0, currentNewReferrals: 0, requiredReferrals: 12 },
        mission4: { completed: false, revealed: false, revealDate: null, requiredBNB: 0.025, requiredSOL: 0.25 }
    };
}

// ============================================================================
// 5. UI FUNCTIONS
// ============================================================================

function showMainApp() {
    const onboarding = document.getElementById('onboardingScreen');
    const mainApp = document.getElementById('mainApp');
    const bottomNav = document.getElementById('bottomNav');
    
    if (onboarding) onboarding.style.display = 'none';
    if (mainApp) mainApp.style.display = 'block';
    if (bottomNav) bottomNav.style.display = 'flex';
}

function updateUI() {
    if (!currentUser) return;
    
    // تحديث اسم المستخدم
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
        userNameEl.textContent = currentUser.userName || (isGuest ? 'Guest' : 'User');
    }
    
    // تحديث ID
    const userIdEl = document.getElementById('userIdDisplay');
    if (userIdEl) {
        userIdEl.textContent = 'ID: ' + (currentUserId || '').slice(-8);
    }
    
    // تحديث الرصيد
    const balanceEl = document.getElementById('trollBalance');
    if (balanceEl) {
        balanceEl.textContent = (currentUser.balances?.TROLL || 0).toLocaleString();
    }
    
    // تحديث الدعوات
    const invitesEl = document.getElementById('totalInvites');
    if (invitesEl) {
        invitesEl.textContent = currentUser.inviteCount || 0;
    }
    
    // تحديث الأرباح
    const earnedEl = document.getElementById('trollEarned');
    if (earnedEl) {
        earnedEl.textContent = (currentUser.referralEarnings || 0).toLocaleString();
    }
    
    // تحديث رابط الدعوة
    const inviteLinkEl = document.getElementById('inviteLink');
    if (inviteLinkEl && !isGuest) {
        inviteLinkEl.value = `https://t.me/TROLLMiniappbot/instant?startapp=${currentUserId}`;
    } else if (inviteLinkEl) {
        inviteLinkEl.value = 'Open from Telegram to get link';
    }
    
    // تحديث قائمة الأصول
    renderAssets();
    
    // تحديث المهام
    renderMissions();
    
    // تحديث الإعدادات
    updateSettingsUI();
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
                    ${!m.mission1.completed ? '<button class="mission-action-btn" onclick="showSolanaWalletModal()">Add Wallet</button>' : ''}
                </div>
            </div>
            <div class="mission-card ${m.mission2.completed ? 'completed' : ''}">
                <div class="mission-icon">${m.mission2.completed ? '✅' : '2️⃣'}</div>
                <div class="mission-content">
                    <h4>Mission 2: Earn 12,500 TROLL from Referrals</h4>
                    <p>${m.mission2.currentAmount || 0} / 12,500 TROLL</p>
                    <div class="progress-bar small"><div class="progress-fill" style="width: ${((m.mission2.currentAmount || 0) / 12500) * 100}%"></div></div>
                </div>
            </div>
            <div class="mission-card ${m.mission3.completed ? 'completed' : ''}">
                <div class="mission-icon">${m.mission3.completed ? '✅' : '3️⃣'}</div>
                <div class="mission-content">
                    <h4>Mission 3: Get 12 New Referrals</h4>
                    <p>${m.mission3.currentNewReferrals || 0} / 12 referrals</p>
                    <div class="progress-bar small"><div class="progress-fill" style="width: ${((m.mission3.currentNewReferrals || 0) / 12) * 100}%"></div></div>
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

function updateSettingsUI() {
    const walletEl = document.getElementById('currentSolanaWallet');
    if (walletEl && currentUser) {
        const wallet = currentUser.settings?.solanaWallet;
        walletEl.textContent = wallet ? wallet.slice(0, 8) + '...' + wallet.slice(-4) : 'Not set';
    }
    
    const userNameEl = document.getElementById('settingsUserName');
    if (userNameEl && currentUser) {
        userNameEl.textContent = currentUser.userName || (isGuest ? 'Guest' : 'User');
    }
}

// ============================================================================
// 6. HELPER FUNCTIONS
// ============================================================================

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
        updateUI();
        showToast('✅ Wallet saved!', 'success');
    } else if (address) {
        showToast('Invalid Solana address', 'error');
    }
}

async function updateMissionsProgress() {
    if (!currentUser || !currentUser.withdrawalMissions) return;
    
    const m = currentUser.withdrawalMissions;
    let changed = false;
    
    // Mission 1: Solana wallet
    if (!m.mission1.completed && currentUser.settings?.solanaWallet) {
        m.mission1.completed = true;
        m.mission2.revealed = true;
        changed = true;
    }
    
    // Mission 2: Referral earnings
    if (m.mission2.revealed && !m.mission2.completed) {
        m.mission2.currentAmount = currentUser.referralEarnings || 0;
        if (m.mission2.currentAmount >= m.mission2.requiredAmount) {
            m.mission2.completed = true;
            m.mission3.revealed = true;
            m.mission3.referralsAtStart = currentUser.inviteCount || 0;
            changed = true;
        }
    }
    
    // Mission 3: New referrals
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
    
    // Mission 4 reveal
    if (m.mission3.completed && !m.mission4.revealed && m.mission4.revealDate) {
        if (new Date() >= new Date(m.mission4.revealDate)) {
            m.mission4.revealed = true;
            changed = true;
        }
    }
    
    // Mission 4: Holdings
    if (m.mission4.revealed && !m.mission4.completed) {
        const bnb = currentUser.balances?.BNB || 0;
        const sol = currentUser.balances?.SOL || 0;
        if (bnb >= m.mission4.requiredBNB || sol >= m.mission4.requiredSOL) {
            m.mission4.completed = true;
            changed = true;
        }
    }
    
    // Check all completed
    const allDone = m.mission1.completed && m.mission2.completed && m.mission3.completed && m.mission4.completed;
    if (allDone && !currentUser.withdrawalUnlocked) {
        currentUser.withdrawalUnlocked = true;
        changed = true;
        showToast('🎉 Congratulations! Withdrawal unlocked!', 'success');
    }
    
    if (changed) {
        await saveUserData();
        if (document.getElementById('airdropSection') && !document.getElementById('airdropSection').classList.contains('hidden')) {
            renderMissions();
        }
    }
}

async function saveUserData() {
    if (!currentUser) return;
    
    currentUser.updatedAt = new Date().toISOString();
    localStorage.setItem(`troll_user_${currentUserId}`, JSON.stringify(currentUser));
    
    if (!isGuest && currentUserId && !currentUserId.startsWith('guest_')) {
        try {
            await fetch(`/api/users/${currentUserId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates: currentUser })
            });
        } catch(e) {}
    }
}

function copyInviteLink() {
    if (isGuest) {
        showToast('Open from Telegram to get invite link', 'warning');
        return;
    }
    
    const link = `https://t.me/TROLLMiniappbot/instant?startapp=${currentUserId}`;
    navigator.clipboard?.writeText(link);
    showToast('🔗 Link copied!', 'success');
}

function showAssetDetails(symbol) {
    const balance = currentUser?.balances?.[symbol] || 0;
    showToast(`${symbol}: ${balance.toLocaleString()}`, 'info');
}

// ============================================================================
// 7. NAVIGATION
// ============================================================================

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
    updateSettingsUI();
}

function showDepositModal() {
    if (isGuest) {
        showToast('Open from Telegram to deposit', 'warning');
        return;
    }
    document.getElementById('depositModal')?.classList.add('show');
}

function showWithdrawModal() {
    if (isGuest) {
        showToast('Open from Telegram to withdraw', 'warning');
        return;
    }
    if (!currentUser.withdrawalUnlocked && !currentUser.premium) {
        showToast('Complete all missions to unlock withdrawal!', 'error');
        return;
    }
    document.getElementById('withdrawModal')?.classList.add('show');
}

function closeModal(id) {
    document.getElementById(id)?.classList.remove('show');
}

function showPremiumModal() {
    if (isGuest) {
        showToast('Open from Telegram to buy premium', 'warning');
        return;
    }
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

// ============================================================================
// 8. EXPOSE GLOBALS
// ============================================================================

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
window.showSolanaWalletModal = showSolanaWalletModal;

console.log("✅ TROLL ARMY v24.0 - Fully Loaded!");
console.log("✅ Telegram detection with multiple fallbacks");
console.log("✅ User registration in Firebase");
console.log("✅ Guest mode fallback ready");
