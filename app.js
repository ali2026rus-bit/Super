// ============================================================
// TROLL ARMY - MYSTERY MISSIONS SYSTEM v16.0
// Telegram WebApp + Firebase + 4 غامضة + إحالات + مؤقت 20 يوم
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
    console.log("✅ Telegram WebApp initialized");
    return true;
}

function extractUserData() {
    if (tg?.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        REAL_USER_ID = user.id?.toString();
        USER_NAME = user.first_name || 'Troll';
        USER_USERNAME = user.username || '';
        console.log("✅ User from initDataUnsafe:", REAL_USER_ID);
        return true;
    }
    if (tg?.initData) {
        try {
            const params = new URLSearchParams(tg.initData);
            const userJson = params.get('user');
            if (userJson) {
                const user = JSON.parse(decodeURIComponent(userJson));
                REAL_USER_ID = user.id?.toString();
                USER_NAME = user.first_name || 'Troll';
                USER_USERNAME = user.username || '';
                console.log("✅ User from initData:", REAL_USER_ID);
                return true;
            }
        } catch(e) {
            console.error("❌ initData parse error:", e);
        }
    }
    return false;
}

// ====== 2. CONFIGURATION ======
const WELCOME_BONUS = 1000;
const REFERRAL_BONUS = 500;
const BOT_LINK = "https://t.me/TROLLMiniappbot/instant";

// المهام الغامضة الأربعة
const MYSTERY_MISSIONS = {
    mission1: {
        id: 'solana_wallet',
        title: 'Mission 1: Connect Wallet',
        description: 'Add your Solana wallet address',
        hint: 'Go to Settings → Solana Wallet'
    },
    mission2: {
        id: 'referral_earnings',
        title: 'Mission 2: Build Wealth',
        description: 'Earn 12,500 TROLL from referrals',
        hint: 'Each referral gives 500 TROLL',
        required: 12500
    },
    mission3: {
        id: 'new_referrals',
        title: 'Mission 3: Expand Army',
        description: 'Get 12 NEW referrals',
        hint: 'Only new referrals after this mission starts count',
        required: 12
    },
    mission4: {
        id: 'holdings',
        title: 'Mission 4: Prove Holdings',
        description: 'Hold 0.025 BNB or 0.25 SOL',
        hint: 'Deposit to your in-app wallet',
        requiredBNB: 0.025,
        requiredSOL: 0.25
    }
};

const MILESTONES = [
    { referrals: 10, reward: 5000, title: '🤡 Baby Troll' },
    { referrals: 25, reward: 12500, title: '😈 Master Troll' },
    { referrals: 100, reward: 25000, title: '👹 Troll Lord' },
    { referrals: 250, reward: 50000, title: '🧌 Troll King' },
    { referrals: 500, reward: 100000, title: '🔥 Troll God' },
    { referrals: 1000, reward: 0, title: '💀 Grand Master', isSpecial: true }
];

// ====== 3. STATE ======
let userData = null;
let currentPage = 'wallet';
let db = null;
let appConfig = {};
let currentLanguage = 'en'; // إنجليزية افتراضية
let currentTheme = localStorage.getItem('theme') || 'dark';

// ====== 4. API CALLS ======
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

// ====== 5. INITIALIZATION ======
async function loadConfig() {
    try {
        const res = await fetch('/api/config');
        appConfig = await res.json();
        if (appConfig.firebaseConfig && typeof firebase !== 'undefined') {
            if (!firebase.apps.length) {
                firebase.initializeApp(appConfig.firebaseConfig);
            }
            db = firebase.firestore();
            console.log('🔥 Firebase ready');
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

// ====== 6. USER DATA & REFERRAL SYSTEM ======
async function loadUserData() {
    try {
        if (!REAL_USER_ID) {
            console.error('❌ No user ID');
            return false;
        }
        
        console.log('📂 Loading user:', REAL_USER_ID);
        let res = await apiCall(`/api/users/${REAL_USER_ID}`);
        
        if (res.success && res.data) {
            userData = res.data;
            console.log('✅ User loaded');
            
            // تأكد من وجود هيكل المهام
            if (!userData.withdrawalMissions) {
                userData.withdrawalMissions = getDefaultMissions();
                await saveUserData();
            }
        } else {
            // مستخدم جديد - إنشاء حساب
            const refCode = getReferralFromUrl();
            userData = createNewUserObject(refCode);
            
            const createRes = await apiCall('/api/users', 'POST', { 
                userId: REAL_USER_ID, 
                userData: userData 
            });
            
            if (createRes.success) {
                console.log('✅ New user created');
                
                // معالجة الإحالة إذا وجدت
                if (refCode && refCode !== REAL_USER_ID) {
                    await processReferral(refCode, REAL_USER_ID);
                }
            } else {
                throw new Error('Failed to create user');
            }
        }
        
        // حفظ في localStorage
        localStorage.setItem(`troll_${REAL_USER_ID}`, JSON.stringify(userData));
        localStorage.setItem('troll_user_id', REAL_USER_ID);
        
        // تحديث تقدم المهام
        await updateMissionsProgress();
        updateUI();
        
        return true;
    } catch (error) {
        console.error('❌ Load user error:', error);
        showToast('Error loading user data', 'error');
        return false;
    }
}

function createNewUserObject(refCode) {
    return {
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
        settings: { solanaWallet: null },
        withdrawalMissions: getDefaultMissions(),
        notifications: [{
            id: Date.now().toString(),
            message: '🎉 Welcome! +1,000 TROLL bonus!',
            read: false,
            timestamp: new Date().toISOString()
        }]
    };
}

function getDefaultMissions() {
    return {
        mission1: { 
            completed: false, 
            revealed: true, 
            walletAddress: null 
        },
        mission2: { 
            completed: false, 
            revealed: false, 
            currentAmount: 0, 
            requiredAmount: 12500 
        },
        mission3: { 
            completed: false, 
            revealed: false, 
            referralsAtStart: 0, 
            currentNewReferrals: 0, 
            requiredReferrals: 12 
        },
        mission4: { 
            completed: false, 
            revealed: false, 
            revealDate: null, 
            requiredBNB: 0.025, 
            requiredSOL: 0.25 
        }
    };
}

async function processReferral(referrerId, newUserId) {
    if (!referrerId || referrerId === newUserId) return;
    console.log('🔗 Processing referral:', referrerId, '→', newUserId);
    
    const res = await apiCall('/api/referral', 'POST', { referrerId, newUserId });
    
    if (res.success) {
        // تحديث بيانات المُحيل محلياً إذا كان هو المستخدم الحالي
        if (referrerId === REAL_USER_ID) {
            userData.inviteCount = (userData.inviteCount || 0) + 1;
            userData.referralEarnings = (userData.referralEarnings || 0) + REFERRAL_BONUS;
            userData.balances.TROLL = (userData.balances.TROLL || 0) + REFERRAL_BONUS;
            userData.referrals.push(newUserId);
            await updateMissionsProgress();
            updateUI();
        }
    }
}

async function saveUserData() {
    await apiCall(`/api/users/${REAL_USER_ID}`, 'PATCH', { 
        updates: { 
            withdrawalMissions: userData.withdrawalMissions,
            withdrawalUnlocked: userData.withdrawalUnlocked,
            settings: userData.settings,
            balances: userData.balances,
            inviteCount: userData.inviteCount,
            referralEarnings: userData.referralEarnings
        } 
    });
}

// ====== 7. MYSTERY MISSIONS SYSTEM ======
async function updateMissionsProgress() {
    if (!userData) return;
    
    const missions = userData.withdrawalMissions;
    let changed = false;
    
    // === MISSION 1: Solana Wallet ===
    if (!missions.mission1.completed) {
        if (userData.settings?.solanaWallet) {
            missions.mission1.completed = true;
            missions.mission1.walletAddress = userData.settings.solanaWallet;
            
            // كشف المهمة الثانية
            if (!missions.mission2.revealed) {
                missions.mission2.revealed = true;
                addNotification('🔓 Mission 2 revealed: Earn 12,500 TROLL from referrals!');
            }
            changed = true;
        }
    }
    
    // === MISSION 2: Referral Earnings ===
    if (missions.mission2.revealed && !missions.mission2.completed) {
        missions.mission2.currentAmount = userData.referralEarnings || 0;
        
        if (missions.mission2.currentAmount >= missions.mission2.requiredAmount) {
            missions.mission2.completed = true;
            
            // كشف المهمة الثالثة
            if (!missions.mission3.revealed) {
                missions.mission3.revealed = true;
                missions.mission3.referralsAtStart = userData.inviteCount || 0;
                addNotification('🔓 Mission 3 revealed: Get 12 NEW referrals!');
            }
            changed = true;
        }
    }
    
    // === MISSION 3: New Referrals ===
    if (missions.mission3.revealed && !missions.mission3.completed) {
        const currentTotal = userData.inviteCount || 0;
        const atStart = missions.mission3.referralsAtStart || 0;
        missions.mission3.currentNewReferrals = Math.max(0, currentTotal - atStart);
        
        if (missions.mission3.currentNewReferrals >= missions.mission3.requiredReferrals) {
            missions.mission3.completed = true;
            
            // تحديد تاريخ كشف المهمة الرابعة (بعد 20 يوم)
            const revealDate = new Date();
            revealDate.setDate(revealDate.getDate() + 20);
            missions.mission4.revealDate = revealDate.toISOString();
            
            addNotification('⏳ Final mission will reveal in 20 days!');
            changed = true;
        }
    }
    
    // === MISSION 4: Reveal Check ===
    if (missions.mission3.completed && !missions.mission4.revealed) {
        const revealDate = new Date(missions.mission4.revealDate);
        if (new Date() >= revealDate) {
            missions.mission4.revealed = true;
            addNotification('🔓 Final mission revealed: Hold 0.025 BNB or 0.25 SOL!');
            changed = true;
        }
    }
    
    // === MISSION 4: Balance Check ===
    if (missions.mission4.revealed && !missions.mission4.completed) {
        const bnb = userData.balances?.BNB || 0;
        const sol = userData.balances?.SOL || 0;
        
        if (bnb >= missions.mission4.requiredBNB || sol >= missions.mission4.requiredSOL) {
            missions.mission4.completed = true;
            changed = true;
        }
    }
    
    // === CHECK UNLOCK ===
    const allCompleted = missions.mission1.completed && 
                        missions.mission2.completed && 
                        missions.mission3.completed && 
                        missions.mission4.completed;
    
    if (allCompleted && !userData.withdrawalUnlocked) {
        userData.withdrawalUnlocked = true;
        addNotification('🎉🎉 WITHDRAWAL UNLOCKED! You can now withdraw your tokens!');
        celebrateUnlock();
        changed = true;
    }
    
    if (changed) {
        await saveUserData();
    }
    
    // تحديث الواجهة إذا كنا في صفحة المهام
    if (currentPage === 'airdrop') {
        renderMissionsUI();
    }
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
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.background = ['#FFD700', '#2ecc71', '#e74c3c', '#3498db'][Math.floor(Math.random() * 4)];
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 4000);
        }, i * 50);
    }
    showToast('🎉 Withdrawal Unlocked! Congratulations!', 'success');
}

// ====== 8. RENDER MISSIONS UI ======
function renderMissionsUI() {
    const container = document.getElementById('withdrawalLockCard');
    if (!container || !userData) return;
    
    const missions = userData.withdrawalMissions;
    
    // Premium user?
    if (userData.premium) {
        container.innerHTML = `
            <div class="premium-unlocked-card">
                <div class="premium-icon-large">😏</div>
                <h3>Premium Unlocked!</h3>
                <p>Instant withdrawal access - No missions required!</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="lock-header">
            <i class="fa-solid fa-${userData.withdrawalUnlocked ? 'unlock' : 'lock'}"></i>
            <span>${userData.withdrawalUnlocked ? '✅ Withdrawal Available!' : '🔒 Withdrawal Locked'}</span>
        </div>
        <div class="missions-list-vertical">
    `;
    
    // Mission 1
    html += renderMission1(missions.mission1);
    
    // Mission 2
    html += renderMission2(missions.mission2);
    
    // Mission 3
    html += renderMission3(missions.mission3);
    
    // Mission 4
    html += renderMission4(missions.mission4);
    
    html += `</div>`;
    container.innerHTML = html;
}

function renderMission1(mission) {
    const completed = mission.completed;
    const wallet = userData.settings?.solanaWallet;
    
    return `
        <div class="mission-card ${completed ? 'completed' : ''}">
            <div class="mission-icon">${completed ? '✅' : '1️⃣'}</div>
            <div class="mission-content">
                <h4>${MYSTERY_MISSIONS.mission1.title}</h4>
                <p>${wallet ? 'Wallet: ' + wallet.slice(0, 8) + '...' : MYSTERY_MISSIONS.mission1.description}</p>
                ${!completed ? `<button class="mission-action-btn" onclick="showSolanaWalletModal()">Add Wallet</button>` : ''}
            </div>
        </div>
    `;
}

function renderMission2(mission) {
    if (!mission.revealed) {
        return `
            <div class="mission-card mystery">
                <div class="mission-icon">❓</div>
                <div class="mission-content">
                    <h4>Mission 2: ???</h4>
                    <p>Reveals after completing Mission 1</p>
                </div>
            </div>
        `;
    }
    
    const completed = mission.completed;
    const current = mission.currentAmount || 0;
    const required = mission.requiredAmount;
    const progress = (current / required) * 100;
    
    return `
        <div class="mission-card ${completed ? 'completed' : ''}">
            <div class="mission-icon">${completed ? '✅' : '2️⃣'}</div>
            <div class="mission-content">
                <h4>${MYSTERY_MISSIONS.mission2.title}</h4>
                <p>${current.toLocaleString()} / ${required.toLocaleString()} TROLL</p>
                <div class="progress-bar small">
                    <div class="progress-fill" style="width:${progress}%"></div>
                </div>
                <p class="mission-hint">💡 ${MYSTERY_MISSIONS.mission2.hint}</p>
            </div>
        </div>
    `;
}

function renderMission3(mission) {
    if (!mission.revealed) {
        return `
            <div class="mission-card mystery">
                <div class="mission-icon">❓</div>
                <div class="mission-content">
                    <h4>Mission 3: ???</h4>
                    <p>Reveals after completing Mission 2</p>
                </div>
            </div>
        `;
    }
    
    const completed = mission.completed;
    const current = mission.currentNewReferrals || 0;
    const required = mission.requiredReferrals;
    const progress = (current / required) * 100;
    
    return `
        <div class="mission-card ${completed ? 'completed' : ''}">
            <div class="mission-icon">${completed ? '✅' : '3️⃣'}</div>
            <div class="mission-content">
                <h4>${MYSTERY_MISSIONS.mission3.title}</h4>
                <p>${current} / ${required} new referrals</p>
                <div class="progress-bar small">
                    <div class="progress-fill" style="width:${progress}%"></div>
                </div>
                <p class="mission-hint">💡 ${MYSTERY_MISSIONS.mission3.hint}</p>
            </div>
        </div>
    `;
}

function renderMission4(mission) {
    if (mission.revealed) {
        const completed = mission.completed;
        const bnb = userData.balances?.BNB || 0;
        const sol = userData.balances?.SOL || 0;
        
        return `
            <div class="mission-card ${completed ? 'completed' : ''}">
                <div class="mission-icon">${completed ? '✅' : '4️⃣'}</div>
                <div class="mission-content">
                    <h4>${MYSTERY_MISSIONS.mission4.title}</h4>
                    <p>BNB: ${bnb.toFixed(4)} / 0.025 | SOL: ${sol.toFixed(4)} / 0.25</p>
                    <p class="mission-hint">💡 ${MYSTERY_MISSIONS.mission4.hint}</p>
                </div>
            </div>
        `;
    }
    
    if (userData.withdrawalMissions.mission3.completed) {
        const revealDate = new Date(mission.revealDate);
        const now = new Date();
        const daysLeft = Math.max(0, Math.ceil((revealDate - now) / (1000 * 60 * 60 * 24)));
        
        return `
            <div class="mission-card mystery-timer">
                <div class="mission-icon">⏳</div>
                <div class="mission-content">
                    <h4>Final Mystery Mission</h4>
                    <p>Reveals in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}</p>
                    <div class="timer-progress-bar">
                        <div class="timer-fill" style="width:${((20 - daysLeft) / 20) * 100}%"></div>
                    </div>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="mission-card mystery">
            <div class="mission-icon">❓</div>
            <div class="mission-content">
                <h4>Mission 4: ???</h4>
                <p>Reveals after completing Mission 3</p>
            </div>
        </div>
    `;
}

// ====== 9. SOLANA WALLET MODAL ======
function showSolanaWalletModal() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
            <div class="modal-icon">🔑</div>
            <h2>Add Solana Wallet</h2>
            <p style="margin-bottom:16px;color:var(--text-secondary);">Enter your TROLL address on Solana network</p>
            <div class="input-group">
                <input type="text" id="solanaAddressInput" placeholder="GzR...kLp" style="width:100%;padding:12px;border-radius:8px;">
            </div>
            <button class="modal-action-btn" onclick="saveSolanaWallet()">Save Address</button>
            <p style="font-size:11px;margin-top:12px;color:#e74c3c;">⚠️ Make sure it's a valid Solana address!</p>
        </div>
    `;
    document.body.appendChild(modal);
}

async function saveSolanaWallet() {
    const input = document.getElementById('solanaAddressInput');
    const address = input?.value.trim();
    
    if (!address || address.length < 32 || address.length > 44) {
        showToast('Invalid Solana address', 'error');
        return;
    }
    
    userData.settings = userData.settings || {};
    userData.settings.solanaWallet = address;
    
    await saveUserData();
    await updateMissionsProgress();
    
    document.querySelector('.modal')?.remove();
    showToast('✅ Wallet saved successfully!', 'success');
    updateUI();
    if (currentPage === 'airdrop') renderMissionsUI();
}

// ====== 10. REFERRAL LINK ======
function getReferralLink() {
    if (!REAL_USER_ID || REAL_USER_ID.startsWith('guest_')) {
        return BOT_LINK;
    }
    return `${BOT_LINK}?startapp=${REAL_USER_ID}`;
}

function copyInviteLink() {
    const link = getReferralLink();
    navigator.clipboard?.writeText(link);
    showToast('🔗 Referral link copied!', 'success');
}

function shareInviteLink() {
    const link = getReferralLink();
    const text = `🧌 Join Troll Army! Get 1,000 TROLL + 500 per referral!\n\n👉 ${link}`;
    tg?.openTelegramLink(`https://t.me/share/url?url=&text=${encodeURIComponent(text)}`);
}

// ====== 11. MILESTONES ======
async function claimMilestone(referrals) {
    const milestone = MILESTONES.find(m => m.referrals === referrals);
    if (!milestone || milestone.isSpecial) return;
    
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
        localStorage.setItem(`troll_${REAL_USER_ID}`, JSON.stringify(userData));
        updateUI();
        showToast(`🎉 Claimed ${milestone.reward.toLocaleString()} TROLL!`, 'success');
    }
}

// ====== 12. UI UPDATES ======
function updateUI() {
    if (!userData) return;
    
    // Header
    const userNameEl = document.getElementById('userName');
    const userIdEl = document.getElementById('userIdDisplay');
    const userAvatarEl = document.getElementById('userAvatar');
    
    if (userNameEl) userNameEl.textContent = userData.userName || USER_NAME;
    if (userIdEl) userIdEl.textContent = `Telegram ID: ${REAL_USER_ID}`;
    if (userAvatarEl) {
        userAvatarEl.textContent = userData.premium ? '😏' : (userData.avatar || '🧌');
        if (userData.premium) userAvatarEl.classList.add('avatar-premium');
    }
    
    // Balance
    const trollBalance = userData.balances?.TROLL || 0;
    const trollBalanceEl = document.getElementById('trollBalance');
    const totalBalanceEl = document.getElementById('totalBalance');
    
    if (trollBalanceEl) trollBalanceEl.textContent = trollBalance.toLocaleString();
    if (totalBalanceEl) totalBalanceEl.textContent = trollBalance.toLocaleString() + ' TROLL';
    
    // Airdrop Stats
    const totalInvitesEl = document.getElementById('totalInvites');
    const trollEarnedEl = document.getElementById('trollEarned');
    const inviteLinkEl = document.getElementById('inviteLink');
    
    if (totalInvitesEl) totalInvitesEl.textContent = userData.inviteCount || 0;
    if (trollEarnedEl) trollEarnedEl.textContent = (userData.referralEarnings || 0).toLocaleString();
    if (inviteLinkEl) inviteLinkEl.value = getReferralLink();
    
    // Settings
    const currentSolanaWallet = document.getElementById('currentSolanaWallet');
    if (currentSolanaWallet) {
        const wallet = userData.settings?.solanaWallet;
        currentSolanaWallet.textContent = wallet ? wallet.slice(0, 8) + '...' + wallet.slice(-4) : 'Not set';
    }
    
    renderMilestones();
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
                <div class="progress-text">${userData.inviteCount}/${m.referrals} referrals</div>
                ${canClaim ? `<button class="claim-btn" onclick="claimMilestone(${m.referrals})">Claim Reward</button>` : ''}
                ${claimed ? '<p style="color:#2ecc71;text-align:center;">✓ Claimed</p>' : ''}
            </div>
        `;
    }).join('');
}

// ====== 13. NAVIGATION ======
function showWallet() {
    currentPage = 'wallet';
    document.getElementById('walletSection')?.classList.remove('hidden');
    document.getElementById('airdropSection')?.classList.add('hidden');
    document.getElementById('settingsSection')?.classList.add('hidden');
    document.querySelectorAll('.nav-item').forEach((i, idx) => i.classList.toggle('active', idx === 0));
}

function showAirdrop() {
    currentPage = 'airdrop';
    document.getElementById('walletSection')?.classList.add('hidden');
    document.getElementById('airdropSection')?.classList.remove('hidden');
    document.getElementById('settingsSection')?.classList.add('hidden');
    document.querySelectorAll('.nav-item').forEach((i, idx) => i.classList.toggle('active', idx === 1));
    renderMissionsUI();
    renderMilestones();
}

function showSettings() {
    currentPage = 'settings';
    document.getElementById('walletSection')?.classList.add('hidden');
    document.getElementById('airdropSection')?.classList.add('hidden');
    document.getElementById('settingsSection')?.classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach((i, idx) => i.classList.toggle('active', idx === 2));
    updateUI();
}

// ====== 14. HELPERS ======
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toastMessage');
    const iconEl = toast?.querySelector('i');
    if (!toast || !msgEl) return;
    
    msgEl.textContent = message;
    if (iconEl) iconEl.className = type === 'error' ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-check';
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function updateNotificationBadge() {
    const badge = document.querySelector('.badge');
    if (badge && userData) {
        const unread = userData.notifications?.filter(n => !n.read).length || 0;
        badge.textContent = unread;
        badge.style.display = unread > 0 ? 'block' : 'none';
    }
}

function closeModal(id) {
    document.getElementById(id)?.classList.remove('show');
}

function logout() {
    localStorage.clear();
    location.reload();
}

// ====== 15. INIT ======
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Troll Army v16.0 - Mystery Missions Starting...');
    
    // Splash screen
    setTimeout(() => {
        document.getElementById('splashScreen')?.classList.add('hidden');
        document.getElementById('mainContent').style.display = 'block';
    }, 2000);
    
    // تهيئة Telegram
    initTelegramApp();
    extractUserData();
    
    // إذا ما في ID، نحاول من الرابط أو localStorage
    if (!REAL_USER_ID) {
        const urlParams = new URLSearchParams(window.location.search);
        const startParam = urlParams.get('startapp') || urlParams.get('start') || urlParams.get('ref');
        if (startParam && /^\d+$/.test(startParam)) {
            REAL_USER_ID = startParam;
        } else {
            const savedId = localStorage.getItem('troll_user_id');
            if (savedId) REAL_USER_ID = savedId;
            else REAL_USER_ID = 'guest_' + Date.now();
        }
    }
    
    console.log('👤 User ID:', REAL_USER_ID);
    
    // تحميل الإعدادات والبيانات
    await loadConfig();
    
    if (!REAL_USER_ID.startsWith('guest_')) {
        await loadUserData();
    } else {
        userData = createNewUserObject(null);
        updateUI();
    }
    
    // تحديث دوري للمهام
    setInterval(updateMissionsProgress, 30000);
    
    console.log('✅ Troll Army Ready!');
});

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
