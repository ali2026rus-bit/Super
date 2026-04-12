// ============================================================
// TROLL ARMY - ULTIMATE AIRDROP SYSTEM v15.0 (MYSTERY MISSIONS)
// Telegram WebApp + Firebase + 4 غامضة + 20 يوم مؤقت + Premium SVG
// ============================================================

// ====== 1. TELEGRAM WEBAPP ======
const tg = window.Telegram?.WebApp;
let isTelegramWebApp = false;
let REAL_USER_ID = null;
let USER_NAME = 'Troll';
let USER_USERNAME = '';

function initTelegramApp() {
    if (!tg) {
        console.warn("⚠️ Telegram WebApp not available");
        return false;
    }
    tg.ready();
    tg.expand();
    isTelegramWebApp = true;
    return true;
}

function extractUserData() {
    if (tg?.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        REAL_USER_ID = user.id?.toString();
        USER_NAME = user.first_name || 'Troll';
        USER_USERNAME = user.username || '';
        return true;
    }
    if (tg?.initData) {
        try {
            const params = new URLSearchParams(tg.initData);
            const userJson = params.get('user');
            if (userJson) {
                const user = JSON.parse(userJson);
                REAL_USER_ID = user.id?.toString();
                USER_NAME = user.first_name || 'Troll';
                USER_USERNAME = user.username || '';
                return true;
            }
        } catch(e) {}
    }
    return false;
}

// ====== 2. CONFIGURATION ======
const WELCOME_BONUS = 1000;
const REFERRAL_BONUS = 500;
const ADMIN_ID = "1653918641";
const BOT_LINK = "https://t.me/TROLLMiniappbot/instant";

const MILESTONES = [
    { referrals: 10, reward: 5000, title: '🤡 Baby Troll' },
    { referrals: 25, reward: 12500, title: '😈 Master Troll' },
    { referrals: 100, reward: 25000, title: '👹 Troll Lord' },
    { referrals: 250, reward: 50000, title: '🧌 Troll King' },
    { referrals: 500, reward: 100000, title: '🔥 Troll God' },
    { referrals: 1000, reward: 0, title: '💀 Grand Master', isSpecial: true }
];

const CURRENCY_ICONS = {
    TROLL: 'https://s2.coinmarketcap.com/static/img/coins/64x64/36313.png',
    SOL: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png',
    BNB: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png',
    ETH: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
    TRON: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1958.png',
    BTC: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png'
};

// ====== 3. STATE ======
let userData = null;
let currentPage = 'wallet';
let db = null;
let appConfig = {};
let cryptoPrices = {};
let tonConnectUI = null;
let tonConnected = false;
let tonWalletAddress = null;
let currentLanguage = localStorage.getItem('language') || 'ar';
let currentTheme = localStorage.getItem('theme') || 'dark';

// ====== 4. TRANSLATIONS ======
const translations = {
    en: {
        'nav.wallet': 'Wallet', 'nav.airdrop': 'Missions', 'nav.settings': 'Settings',
        'wallet.totalBalance': 'Total Balance', 'airdrop.missions': 'Mystery Missions',
        'mission.revealLater': 'Will be revealed after completing previous mission',
        'mission.waitDays': 'Reveals in {days} days'
    },
    ar: {
        'nav.wallet': 'المحفظة', 'nav.airdrop': 'المهام', 'nav.settings': 'الإعدادات',
        'wallet.totalBalance': 'الرصيد الإجمالي', 'airdrop.missions': 'المهام الغامضة',
        'mission.revealLater': 'ستكشف بعد إكمال المهمة السابقة',
        'mission.waitDays': 'ستكشف بعد {days} يوم'
    }
};

function t(key, params = {}) {
    let text = translations[currentLanguage]?.[key] || translations.en[key] || key;
    Object.keys(params).forEach(k => text = text.replace(`{${k}}`, params[k]));
    return text;
}

// ====== 5. API CALLS ======
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    try {
        const res = await fetch(endpoint, options);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (error) {
        console.error('❌ API Error:', error);
        return { success: false, error: error.message };
    }
}

// ====== 6. INITIALIZATION ======
async function loadConfig() {
    try {
        const res = await fetch('/api/config');
        appConfig = await res.json();
        if (appConfig.firebaseConfig && typeof firebase !== 'undefined') {
            if (!firebase.apps.length) firebase.initializeApp(appConfig.firebaseConfig);
            db = firebase.firestore();
        }
        return true;
    } catch (error) {
        console.error('❌ Config error:', error);
        return false;
    }
}

function getReferralFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('startapp') || params.get('start') || params.get('ref');
}

async function loadUserData() {
    try {
        if (!REAL_USER_ID) return false;
        
        let res = await apiCall(`/api/users/${REAL_USER_ID}`);
        
        if (res.success && res.data) {
            userData = res.data;
            console.log('✅ User loaded');
        } else {
            const refCode = getReferralFromUrl();
            const newUser = {
                userId: REAL_USER_ID,
                userName: USER_NAME,
                userUsername: USER_USERNAME,
                balances: { TROLL: WELCOME_BONUS, BNB: 0, SOL: 0, ETH: 0, TRON: 0 },
                referralCode: REAL_USER_ID,
                referredBy: refCode || null,
                referrals: [],
                inviteCount: 0,
                referralEarnings: 0,
                totalEarned: WELCOME_BONUS,
                premium: false,
                avatar: '🧌',
                createdAt: new Date().toISOString(),
                withdrawalUnlocked: false,
                claimedMilestones: [],
                tonWallet: null,
                settings: { solanaWallet: null },
                withdrawalMissions: {
                    mission1: { completed: false, revealed: true, walletAddress: null, savedAt: null },
                    mission2: { completed: false, revealed: false, requiredAmount: 12500, currentAmount: 0, startDate: null },
                    mission3: { completed: false, revealed: false, requiredReferrals: 12, referralsAtStart: 0, currentNewReferrals: 0, startDate: null },
                    mission4: { completed: false, revealed: false, revealDate: null, requiredBNB: 0.025, requiredSOL: 0.25 }
                },
                notifications: [{
                    id: Date.now().toString(),
                    message: currentLanguage === 'ar' ? '🎉 أهلاً بك! +1,000 TROLL' : '🎉 Welcome! +1,000 TROLL',
                    read: false,
                    timestamp: new Date().toISOString()
                }]
            };
            
            const createRes = await apiCall('/api/users', 'POST', { userId: REAL_USER_ID, userData: newUser });
            if (createRes.success) {
                userData = newUser;
                if (refCode && refCode !== REAL_USER_ID) await processReferral(refCode, REAL_USER_ID);
            }
        }
        
        localStorage.setItem(`troll_${REAL_USER_ID}`, JSON.stringify(userData));
        localStorage.setItem('troll_user_id', REAL_USER_ID);
        localStorage.setItem('troll_user_name', USER_NAME);
        
        await updateMissionsProgress();
        updateUI();
        return true;
    } catch (error) {
        console.error('❌ Load user error:', error);
        return false;
    }
}

async function processReferral(referrerId, newUserId) {
    if (!referrerId || referrerId === newUserId) return;
    await apiCall('/api/referral', 'POST', { referrerId, newUserId });
}

// ====== 7. المهام الغامضة - القلب النابض ======
async function updateMissionsProgress() {
    if (!userData) return;
    
    const missions = userData.withdrawalMissions;
    let changed = false;
    
    // المهمة 1: محفظة Solana
    if (!missions.mission1.completed) {
        missions.mission1.revealed = true;
        if (userData.settings?.solanaWallet) {
            missions.mission1.completed = true;
            missions.mission1.walletAddress = userData.settings.solanaWallet;
            missions.mission1.savedAt = new Date().toISOString();
            
            // كشف المهمة 2
            if (!missions.mission2.revealed) {
                missions.mission2.revealed = true;
                missions.mission2.startDate = new Date().toISOString();
                addNotification(currentLanguage === 'ar' ? '🔓 تم كشف المهمة الثانية!' : '🔓 Mission 2 revealed!');
            }
            changed = true;
        }
    }
    
    // المهمة 2: 12,500 من الإحالات
    if (missions.mission2.revealed && !missions.mission2.completed) {
        missions.mission2.currentAmount = (userData.inviteCount || 0) * REFERRAL_BONUS;
        if (missions.mission2.currentAmount >= missions.mission2.requiredAmount) {
            missions.mission2.completed = true;
            
            if (!missions.mission3.revealed) {
                missions.mission3.revealed = true;
                missions.mission3.startDate = new Date().toISOString();
                missions.mission3.referralsAtStart = userData.inviteCount || 0;
                addNotification(currentLanguage === 'ar' ? '🔓 تم كشف المهمة الثالثة!' : '🔓 Mission 3 revealed!');
            }
            changed = true;
        }
    }
    
    // المهمة 3: 12 إحالة جديدة
    if (missions.mission3.revealed && !missions.mission3.completed) {
        const currentTotal = userData.inviteCount || 0;
        const atStart = missions.mission3.referralsAtStart || 0;
        missions.mission3.currentNewReferrals = Math.max(0, currentTotal - atStart);
        
        if (missions.mission3.currentNewReferrals >= missions.mission3.requiredReferrals) {
            missions.mission3.completed = true;
            
            // تحديد تاريخ كشف المهمة 4 (بعد 20 يوم)
            const revealDate = new Date();
            revealDate.setDate(revealDate.getDate() + 20);
            missions.mission4.revealDate = revealDate.toISOString();
            
            addNotification(currentLanguage === 'ar' ? '⏳ المهمة النهائية ستكشف بعد 20 يوم!' : '⏳ Final mission reveals in 20 days!');
            changed = true;
        }
    }
    
    // المهمة 4: التحقق من التاريخ
    if (missions.mission3.completed && !missions.mission4.revealed) {
        const revealDate = new Date(missions.mission4.revealDate);
        if (new Date() >= revealDate) {
            missions.mission4.revealed = true;
            addNotification(currentLanguage === 'ar' ? '🔓 تم كشف المهمة النهائية!' : '🔓 Final mission revealed!');
            changed = true;
        }
    }
    
    // المهمة 4: التحقق من الرصيد
    if (missions.mission4.revealed && !missions.mission4.completed) {
        const bnb = userData.balances?.BNB || 0;
        const sol = userData.balances?.SOL || 0;
        if (bnb >= missions.mission4.requiredBNB || sol >= missions.mission4.requiredSOL) {
            missions.mission4.completed = true;
            changed = true;
        }
    }
    
    // فتح السحب
    const allCompleted = missions.mission1.completed && missions.mission2.completed && 
                        missions.mission3.completed && missions.mission4.completed;
    
    if (allCompleted && !userData.withdrawalUnlocked) {
        userData.withdrawalUnlocked = true;
        addNotification('🎉🎉 ' + (currentLanguage === 'ar' ? 'تم فتح السحب! يمكنك الآن سحب عملاتك!' : 'Withdrawal Unlocked! You can now withdraw!'));
        celebrateUnlock();
        changed = true;
    }
    
    if (changed) {
        await apiCall(`/api/users/${REAL_USER_ID}`, 'PATCH', { 
            updates: { 
                withdrawalMissions: missions, 
                withdrawalUnlocked: userData.withdrawalUnlocked 
            } 
        });
    }
    
    if (currentPage === 'airdrop') renderMissionsUI();
}

function addNotification(message) {
    if (!userData.notifications) userData.notifications = [];
    userData.notifications.unshift({
        id: Date.now().toString(),
        message,
        read: false,
        timestamp: new Date().toISOString()
    });
    updateNotificationBadge();
}

function celebrateUnlock() {
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.background = ['#FFD700', '#2ecc71', '#e74c3c', '#3498db'][Math.floor(Math.random() * 4)];
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 4000);
    }
    showToast(currentLanguage === 'ar' ? '🎉 تهانينا! تم فتح السحب!' : '🎉 Withdrawal Unlocked!', 'success');
}

// ====== 8. RENDER MISSIONS UI ======
function renderMissionsUI() {
    const container = document.getElementById('withdrawalLockCard');
    if (!container || !userData) return;
    
    const missions = userData.withdrawalMissions;
    
    if (userData.premium) {
        container.innerHTML = `
            <div class="premium-unlocked-card">
                <div class="premium-icon-large">${getTrollFaceSVG()}</div>
                <h3>${currentLanguage === 'ar' ? 'بريميوم مفعل!' : 'Premium Unlocked!'}</h3>
                <p>${currentLanguage === 'ar' ? 'سحب فوري بدون مهام!' : 'Instant withdrawal access!'}</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="lock-header">
            <i class="fa-solid fa-lock"></i>
            <span>${userData.withdrawalUnlocked ? '✅ ' + (currentLanguage === 'ar' ? 'السحب متاح!' : 'Withdrawal Available!') : (currentLanguage === 'ar' ? 'السحب مقفل - أكمل المهام' : 'Withdrawal Locked - Complete Missions')}</span>
        </div>
        <div class="missions-list-vertical">
    `;
    
    // المهمة 1
    html += renderMissionCard(1, missions.mission1, {
        title: currentLanguage === 'ar' ? 'إضافة محفظة Solana' : 'Add Solana Wallet',
        desc: currentLanguage === 'ar' ? 'أدخل عنوان TROLL على شبكة Solana' : 'Enter TROLL address on Solana',
        action: !missions.mission1.completed ? 'showSolanaWalletModal()' : null,
        actionText: currentLanguage === 'ar' ? 'إضافة عنوان' : 'Add Address'
    });
    
    // المهمة 2
    if (missions.mission2.revealed) {
        html += renderMissionCard(2, missions.mission2, {
            title: currentLanguage === 'ar' ? 'جمع 12,500 TROLL من الإحالات' : 'Earn 12,500 TROLL from referrals',
            desc: `${missions.mission2.currentAmount.toLocaleString()} / 12,500`,
            progress: (missions.mission2.currentAmount / 12500) * 100
        });
    } else {
        html += renderMysteryCard(2);
    }
    
    // المهمة 3
    if (missions.mission3.revealed) {
        html += renderMissionCard(3, missions.mission3, {
            title: currentLanguage === 'ar' ? 'جلب 12 إحالة جديدة' : 'Get 12 New Referrals',
            desc: `${missions.mission3.currentNewReferrals} / 12`,
            progress: (missions.mission3.currentNewReferrals / 12) * 100
        });
    } else {
        html += renderMysteryCard(3);
    }
    
    // المهمة 4
    if (missions.mission4.revealed) {
        const bnb = userData.balances?.BNB || 0;
        const sol = userData.balances?.SOL || 0;
        const completed = bnb >= 0.025 || sol >= 0.25;
        html += renderMissionCard(4, { completed }, {
            title: currentLanguage === 'ar' ? 'إثبات الملاءة' : 'Prove Solvency',
            desc: currentLanguage === 'ar' ? '0.025 BNB أو 0.25 SOL في المحفظة' : '0.025 BNB or 0.25 SOL in wallet',
            extra: `<div style="font-size:12px;margin-top:8px;">BNB: ${bnb.toFixed(4)} | SOL: ${sol.toFixed(4)}</div>`
        });
    } else if (missions.mission3.completed) {
        const revealDate = new Date(missions.mission4.revealDate);
        const now = new Date();
        const daysLeft = Math.max(0, Math.ceil((revealDate - now) / (1000 * 60 * 60 * 24)));
        
        html += `
            <div class="mission-card mystery-timer">
                <div class="mission-icon">⏳</div>
                <div class="mission-content">
                    <h4>${currentLanguage === 'ar' ? 'المهمة الغامضة النهائية' : 'Final Mystery Mission'}</h4>
                    <p>${t('mission.waitDays', {days: daysLeft})}</p>
                    <div class="timer-progress-bar">
                        <div class="timer-fill" style="width:${((20 - daysLeft) / 20) * 100}%"></div>
                    </div>
                </div>
            </div>
        `;
    } else {
        html += renderMysteryCard(4);
    }
    
    html += `</div>`;
    container.innerHTML = html;
}

function renderMissionCard(num, mission, opts) {
    const completed = mission.completed;
    return `
        <div class="mission-card ${completed ? 'completed' : ''}">
            <div class="mission-icon">${completed ? '✅' : '🔒'}</div>
            <div class="mission-content">
                <h4>${opts.title}</h4>
                <p>${opts.desc}</p>
                ${opts.progress !== undefined ? `
                    <div class="progress-bar small">
                        <div class="progress-fill" style="width:${opts.progress}%"></div>
                    </div>
                ` : ''}
                ${opts.extra || ''}
            </div>
            ${opts.action && !completed ? `
                <button class="mission-action-btn" onclick="${opts.action}">${opts.actionText}</button>
            ` : ''}
        </div>
    `;
}

function renderMysteryCard(num) {
    return `
        <div class="mission-card mystery">
            <div class="mission-icon">❓</div>
            <div class="mission-content">
                <h4>${currentLanguage === 'ar' ? `المهمة ${num} - غامضة` : `Mission ${num} - Mystery`}</h4>
                <p>${t('mission.revealLater')}</p>
            </div>
        </div>
    `;
}

// ====== 9. SVG TROLL FACE ======
function getTrollFaceSVG() {
    return `
        <svg viewBox="0 0 100 100" width="60" height="60">
            <defs>
                <radialGradient id="faceGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style="stop-color:#FFD700;stop-opacity:0.9" />
                    <stop offset="100%" style="stop-color:#DAA520;stop-opacity:1" />
                </radialGradient>
                <linearGradient id="eyeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#FFFFFF" />
                    <stop offset="100%" style="stop-color:#E0E0E0" />
                </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="48" fill="url(#faceGrad)" stroke="#B8860B" stroke-width="2"/>
            <path d="M 28 68 Q 50 88, 78 58 Q 82 52, 75 48 Q 58 70, 28 62 Z" fill="#2C1810" />
            <ellipse cx="35" cy="40" rx="8" ry="10" fill="url(#eyeGrad)" stroke="#333" stroke-width="1"/>
            <circle cx="38" cy="40" r="3" fill="#000"/>
            <path d="M 23 28 Q 35 22, 47 28" stroke="#2C1810" stroke-width="3" fill="none" stroke-linecap="round"/>
            <ellipse cx="65" cy="40" rx="8" ry="10" fill="url(#eyeGrad)" stroke="#333" stroke-width="1"/>
            <circle cx="62" cy="42" r="3" fill="#000"/>
            <path d="M 53 28 Q 65 22, 77 28" stroke="#2C1810" stroke-width="3" fill="none" stroke-linecap="round"/>
            <circle cx="75" cy="35" r="2" fill="#FF4444" opacity="0.6"/>
        </svg>
    `;
}

// ====== 10. ACTIONS ======
function showSolanaWalletModal() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
            <div class="modal-icon">🔑</div>
            <h2>${currentLanguage === 'ar' ? 'إضافة محفظة Solana' : 'Add Solana Wallet'}</h2>
            <p style="color:var(--text-secondary);margin-bottom:16px;">${currentLanguage === 'ar' ? 'أدخل عنوان TROLL على شبكة Solana' : 'Enter TROLL address on Solana network'}</p>
            <div class="input-group">
                <input type="text" id="solanaAddressInput" placeholder="GzR...kLp" style="width:100%;padding:12px;border-radius:8px;border:1px solid var(--border-light);background:var(--bg-primary);color:var(--text-primary);">
            </div>
            <button class="modal-action-btn" onclick="saveSolanaWallet()">${currentLanguage === 'ar' ? 'حفظ العنوان' : 'Save Address'}</button>
            <p style="font-size:11px;margin-top:12px;color:#e74c3c;">${currentLanguage === 'ar' ? 'تأكد من صحة العنوان!' : 'Ensure address is correct!'}</p>
        </div>
    `;
    document.body.appendChild(modal);
}

async function saveSolanaWallet() {
    const input = document.getElementById('solanaAddressInput');
    const address = input?.value.trim();
    
    if (!address || address.length < 32) {
        showToast(currentLanguage === 'ar' ? 'عنوان غير صالح' : 'Invalid address', 'error');
        return;
    }
    
    userData.settings = userData.settings || {};
    userData.settings.solanaWallet = address;
    
    await apiCall(`/api/users/${REAL_USER_ID}`, 'PATCH', { updates: { settings: userData.settings } });
    await updateMissionsProgress();
    
    document.querySelector('.modal')?.remove();
    showToast(currentLanguage === 'ar' ? '✅ تم حفظ العنوان!' : '✅ Address saved!', 'success');
}

function copyInviteLink() {
    const link = `${BOT_LINK}?startapp=${REAL_USER_ID}`;
    navigator.clipboard?.writeText(link);
    showToast(currentLanguage === 'ar' ? '🔗 تم نسخ الرابط!' : '🔗 Link copied!');
}

// ====== 11. UI UPDATES ======
function updateUI() {
    if (!userData) return;
    
    // Header
    document.getElementById('userName').textContent = userData.userName || USER_NAME;
    document.getElementById('userIdDisplay').textContent = `ID: ${REAL_USER_ID}`;
    const avatarEl = document.getElementById('userAvatar');
    if (avatarEl) {
        if (userData.premium) {
            avatarEl.innerHTML = getTrollFaceSVG();
            avatarEl.classList.add('avatar-premium');
        } else {
            avatarEl.textContent = userData.avatar || '🧌';
        }
    }
    
    // Balance
    const troll = userData.balances?.TROLL || 0;
    document.getElementById('trollBalance').textContent = troll.toLocaleString();
    document.getElementById('totalInvites').textContent = userData.inviteCount || 0;
    document.getElementById('trollEarned').textContent = (userData.referralEarnings || 0).toLocaleString();
    document.getElementById('inviteLink').value = `${BOT_LINK}?startapp=${REAL_USER_ID}`;
    
    renderAssets();
    renderMilestones();
    if (currentPage === 'airdrop') renderMissionsUI();
}

function renderAssets() {
    const container = document.getElementById('assetsList');
    if (!container) return;
    
    const assets = [
        { symbol: 'TROLL', name: 'Troll Token' },
        { symbol: 'SOL', name: 'Solana' },
        { symbol: 'BNB', name: 'BNB' },
        { symbol: 'ETH', name: 'Ethereum' },
        { symbol: 'TRON', name: 'TRON' }
    ];
    
    container.innerHTML = assets.map(asset => {
        const balance = userData?.balances?.[asset.symbol] || 0;
        return `
            <div class="asset-item">
                <div class="asset-left">
                    <img src="${CURRENCY_ICONS[asset.symbol]}" class="asset-icon-img">
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

function renderMilestones() {
    const container = document.getElementById('milestonesList');
    if (!container) return;
    
    container.innerHTML = MILESTONES.map(m => {
        const progress = Math.min((userData.inviteCount / m.referrals) * 100, 100);
        const claimed = userData.claimedMilestones?.includes(m.referrals);
        
        return `
            <div class="milestone-item ${claimed ? 'claimed' : ''}">
                <div class="milestone-header">
                    <span>${m.title}</span>
                    <span>${m.isSpecial ? '🎁' : m.reward.toLocaleString() + ' TROLL'}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width:${progress}%"></div>
                </div>
                <div class="progress-text">${userData.inviteCount}/${m.referrals}</div>
                ${!claimed && userData.inviteCount >= m.referrals && !m.isSpecial ? 
                    `<button class="claim-btn" onclick="claimMilestone(${m.referrals})">${currentLanguage === 'ar' ? 'مطالبة' : 'Claim'}</button>` : ''}
            </div>
        `;
    }).join('');
}

async function claimMilestone(referrals) {
    const milestone = MILESTONES.find(m => m.referrals === referrals);
    if (!milestone) return;
    
    const res = await apiCall('/api/claim-milestone', 'POST', {
        userId: REAL_USER_ID,
        milestoneReferrals: referrals,
        reward: milestone.reward
    });
    
    if (res.success) {
        userData.balances.TROLL += milestone.reward;
        userData.totalEarned += milestone.reward;
        if (!userData.claimedMilestones) userData.claimedMilestones = [];
        userData.claimedMilestones.push(referrals);
        updateUI();
        showToast(`🎉 +${milestone.reward.toLocaleString()} TROLL!`);
    }
}

// ====== 12. NAVIGATION ======
function showWallet() {
    currentPage = 'wallet';
    document.getElementById('walletSection').classList.remove('hidden');
    document.getElementById('airdropSection').classList.add('hidden');
    document.getElementById('settingsSection').classList.add('hidden');
    document.querySelectorAll('.nav-item').forEach((i, idx) => i.classList.toggle('active', idx === 0));
}

function showAirdrop() {
    currentPage = 'airdrop';
    document.getElementById('walletSection').classList.add('hidden');
    document.getElementById('airdropSection').classList.remove('hidden');
    document.getElementById('settingsSection').classList.add('hidden');
    document.querySelectorAll('.nav-item').forEach((i, idx) => i.classList.toggle('active', idx === 1));
    renderMissionsUI();
    renderMilestones();
}

function showSettings() {
    currentPage = 'settings';
    document.getElementById('walletSection').classList.add('hidden');
    document.getElementById('airdropSection').classList.add('hidden');
    document.getElementById('settingsSection').classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach((i, idx) => i.classList.toggle('active', idx === 2));
    
    document.getElementById('settingsAvatar').innerHTML = userData.premium ? getTrollFaceSVG() : (userData.avatar || '🧌');
    document.getElementById('settingsUserName').textContent = userData.userName;
    document.getElementById('settingsUserId').textContent = `ID: ${REAL_USER_ID}`;
    document.getElementById('currentSolanaWallet').textContent = userData.settings?.solanaWallet || (currentLanguage === 'ar' ? 'غير مضاف' : 'Not added');
}

// ====== 13. HELPERS ======
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toastMessage');
    const iconEl = toast.querySelector('i');
    msgEl.textContent = message;
    iconEl.className = type === 'error' ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-check';
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function updateNotificationBadge() {
    const badge = document.querySelector('.badge');
    if (badge) {
        const unread = userData?.notifications?.filter(n => !n.read).length || 0;
        badge.textContent = unread;
        badge.style.display = unread > 0 ? 'block' : 'none';
    }
}

function toggleLanguage() {
    currentLanguage = currentLanguage === 'en' ? 'ar' : 'en';
    localStorage.setItem('language', currentLanguage);
    location.reload();
}

// ====== 14. INIT ======
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Troll Army v15.0 - Mystery Missions System');
    
    initTheme();
    initTelegramApp();
    extractUserData();
    
    if (!REAL_USER_ID) {
        const savedId = localStorage.getItem('troll_user_id');
        if (savedId) REAL_USER_ID = savedId;
        else REAL_USER_ID = 'guest_' + Date.now();
    }
    
    setTimeout(() => {
        document.getElementById('splashScreen')?.classList.add('hidden');
        document.getElementById('mainContent').style.display = 'block';
    }, 2000);
    
    await loadConfig();
    await loadUserData();
    
    setInterval(updateMissionsProgress, 30000);
    
    console.log('✅ Troll Army Ready with Mystery Missions!');
});

function initTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    if (currentLanguage === 'ar') {
        document.body.classList.add('rtl');
        document.documentElement.dir = 'rtl';
    }
}

// ====== 15. EXPORTS ======
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
window.updateDepositInfo = updateDepositInfo;
window.closeAdminPanel = closeAdminPanel;
window.showAdminTab = showAdminTab;
window.adminRefreshStats = adminRefreshStats;
window.adminSendBroadcast = adminSendBroadcast;

console.log('✅ Troll Army v14.0 - Production Ready! 🧌🔥😏');
