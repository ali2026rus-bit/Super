// ============================================================================
// TROLL ARMY - WORKING VERSION (مثل REFI Network)
// ============================================================================

// ====== 1. الحصول على userId مباشرة (بدون سيرفر) ======
const tg = window.Telegram?.WebApp;

if (tg) {
    tg.ready();
    tg.expand();
}

// 🔑 السطر السحري - نفس طريقة REFI Network
const userId = tg?.initDataUnsafe?.user?.id?.toString() || 
               localStorage.getItem('troll_user_id') || 
               'guest_' + Date.now();

const userName = tg?.initDataUnsafe?.user?.first_name || 'Troll';
const userUsername = tg?.initDataUnsafe?.user?.username || '';

// حفظ للجلسات المستقبلية
localStorage.setItem('troll_user_id', userId);
localStorage.setItem('troll_user_name', userName);

console.log("✅ USER DETECTED:", userId, userName);
console.log("✅ Guest mode:", !tg?.initDataUnsafe?.user?.id);

// ====== 2. تحميل أو إنشاء المستخدم ======
let currentUser = null;
let isGuest = !tg?.initDataUnsafe?.user?.id;

async function loadOrCreateUser() {
    // محاولة تحميل من localStorage أولاً
    const saved = localStorage.getItem(`troll_user_${userId}`);
    if (saved) {
        currentUser = JSON.parse(saved);
        console.log("📦 User loaded from localStorage");
        renderUI();
        return;
    }
    
    // محاولة تحميل من السيرفر (بدون initData)
    try {
        const res = await fetch(`/api/users/${userId}`);
        const data = await res.json();
        
        if (data.success && data.data) {
            currentUser = data.data;
            localStorage.setItem(`troll_user_${userId}`, JSON.stringify(currentUser));
            console.log("✅ User loaded from server");
            renderUI();
            return;
        }
    } catch(e) {
        console.log("Server not available, creating local user");
    }
    
    // إنشاء مستخدم جديد محلياً
    currentUser = {
        userId: userId,
        userName: userName,
        userUsername: userUsername,
        balances: { TROLL: 1000, BNB: 0, SOL: 0, ETH: 0, TRON: 0 },
        referralCode: userId,
        invitedBy: null,
        referrals: [],
        inviteCount: 0,
        referralEarnings: 0,
        totalEarned: 1000,
        premium: false,
        avatar: '🧌',
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
        transactions: [],
        createdAt: new Date().toISOString()
    };
    
    localStorage.setItem(`troll_user_${userId}`, JSON.stringify(currentUser));
    console.log("🆕 New user created locally");
    renderUI();
    
    // محاولة حفظ على السيرفر (اختياري)
    try {
        await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userId, userData: currentUser })
        });
    } catch(e) {}
}

// ====== 3. BASIC UI RENDER ======
function renderUI() {
    if (!currentUser) return;
    
    const nameEl = document.getElementById('userName');
    if (nameEl) nameEl.textContent = currentUser.userName || 'User';
    
    const idEl = document.getElementById('userIdDisplay');
    if (idEl) idEl.textContent = 'ID: ' + (userId || '').slice(-8);
    
    const balanceEl = document.getElementById('trollBalance');
    if (balanceEl) balanceEl.textContent = (currentUser.balances?.TROLL || 0).toLocaleString();
    
    const invitesEl = document.getElementById('totalInvites');
    if (invitesEl) invitesEl.textContent = currentUser.inviteCount || 0;
    
    const linkEl = document.getElementById('inviteLink');
    if (linkEl) linkEl.value = `https://t.me/TROLLMiniappbot/instant?startapp=${userId}`;
    
    // عرض رسالة إذا كان ضيف
    if (isGuest) {
        showToast('⚠️ Guest Mode - Connect Telegram for full access', 'info');
    }
}

function showToast(msg, type) {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toastMessage');
    if (!toast || !msgEl) return;
    msgEl.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// ====== 4. NAVIGATION ======
function showWallet() {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById('walletSection')?.classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector('[data-tab="wallet"]')?.classList.add('active');
}

function showAirdrop() {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById('airdropSection')?.classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector('[data-tab="airdrop"]')?.classList.add('active');
}

function showSettings() {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById('settingsSection')?.classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector('[data-tab="settings"]')?.classList.add('active');
}

// ====== 5. START ======
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Troll Army Starting...");
    
    // إخفاء splash بعد 2 ثانية
    setTimeout(() => {
        const splash = document.getElementById('splashScreen');
        if (splash) splash.classList.add('hidden');
    }, 2000);
    
    // تحميل المستخدم
    loadOrCreateUser();
    
    // إظهار الواجهة الرئيسية
    const onboarding = document.getElementById('onboardingScreen');
    const mainApp = document.getElementById('mainApp');
    const bottomNav = document.getElementById('bottomNav');
    
    if (onboarding) onboarding.style.display = 'none';
    if (mainApp) mainApp.style.display = 'block';
    if (bottomNav) bottomNav.style.display = 'flex';
});

// ====== EXPORTS ======
window.showWallet = showWallet;
window.showAirdrop = showAirdrop;
window.showSettings = showSettings;
window.showDepositModal = () => alert('Coming soon');
window.showWithdrawModal = () => alert('Coming soon');
window.copyInviteLink = () => {
    const link = `https://t.me/TROLLMiniappbot/instant?startapp=${userId}`;
    navigator.clipboard?.writeText(link);
    showToast('Link copied!', 'success');
};
