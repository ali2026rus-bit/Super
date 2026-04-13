// ============================================================================
// TROLL ARMY - FINAL PROFESSIONAL VERSION
// Logic: Telegram (8s) → Restore (24h) → Guest (last)
// Features: CoinGecko Live Prices + Mystery Missions + TON + Referrals
// ============================================================================

// ====== TELEGRAM WEBAPP ======
const tg = window.Telegram?.WebApp;

// ====== STATE ======
let currentUser = null;
let currentUserId = null;
let isGuest = false;
let currentPage = 'wallet';
let db = null;
let tonConnectUI = null;
let tonConnected = false;
let tonWalletAddress = null;
let appConfig = {};
let cryptoPrices = {};
let lastPricesFetch = 0;

// ====== CONFIG ======
const CONFIG = {
    BOT_LINK: 'https://t.me/TROLLMiniappbot/instant',
    WELCOME_BONUS: 1000,
    REFERRAL_BONUS: 500,
    TROLL_PRICE_FALLBACK: 0.01915,
    SESSION_TTL: 86400000, // 24 hours
    PRICES_CACHE_TTL: 300000 // 5 minutes
};

// ====== ICONS ======
const ICONS = {
    TROLL: 'https://s2.coinmarketcap.com/static/img/coins/64x64/36313.png',
    SOL: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png',
    BNB: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png',
    ETH: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
    TRON: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1958.png',
    BTC: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png',
    DOGE: 'https://s2.coinmarketcap.com/static/img/coins/64x64/74.png',
    SHIB: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5994.png',
    PEPE: 'https://s2.coinmarketcap.com/static/img/coins/64x64/24478.png',
    BONK: 'https://s2.coinmarketcap.com/static/img/coins/64x64/23095.png',
    WIF: 'https://s2.coinmarketcap.com/static/img/coins/64x64/28752.png'
};

// ====== ASSETS ======
const ALL_ASSETS = [
    { symbol: 'TROLL', name: 'Troll Token' },
    { symbol: 'SOL', name: 'Solana' },
    { symbol: 'BNB', name: 'BNB' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'TRON', name: 'TRON' }
];

// ====== COINGECKO COINS ======
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
    { symbol: 'PEPE', name: 'Pepe', coingeckoId: 'pepe' },
    { symbol: 'BONK', name: 'Bonk', coingeckoId: 'bonk' },
    { symbol: 'WIF', name: 'Dogwifhat', coingeckoId: 'dogwifcoin' }
];

// ====== MYSTERY MISSIONS ======
const MISSIONS = {
    mission1: { id: 'solana_wallet', title: 'Mission 1: Connect Solana', desc: 'Add your TROLL Solana wallet', hint: 'Go to Settings → Solana Wallet' },
    mission2: { id: 'referral_earnings', title: 'Mission 2: Build Wealth', desc: 'Earn 12,500 TROLL from referrals', hint: 'Each referral gives 500 TROLL', required: 12500 },
    mission3: { id: 'new_referrals', title: 'Mission 3: Expand Army', desc: 'Get 12 NEW referrals', hint: 'Only new referrals count', required: 12 },
    mission4: { id: 'holdings', title: 'Mission 4: Prove Holdings', desc: 'Hold 0.025 BNB or 0.25 SOL', hint: 'Deposit to your wallet', requiredBNB: 0.025, requiredSOL: 0.25 }
};

// ====== MILESTONES ======
const MILESTONES = [
    { referrals: 10, reward: 5000, title: '🤡 Baby Troll' },
    { referrals: 25, reward: 12500, title: '😈 Master Troll' },
    { referrals: 100, reward: 25000, title: '👹 Troll Lord' },
    { referrals: 250, reward: 50000, title: '🧌 Troll King' },
    { referrals: 500, reward: 100000, title: '🔥 Troll God' },
    { referrals: 1000, reward: 0, title: '💀 Grand Master', isSpecial: true }
];

// ====== DEFAULT MISSIONS ======
function getDefaultMissions() {
    return {
        mission1: { completed: false, revealed: true, walletAddress: null },
        mission2: { completed: false, revealed: false, currentAmount: 0, requiredAmount: 12500 },
        mission3: { completed: false, revealed: false, referralsAtStart: 0, currentNewReferrals: 0, requiredReferrals: 12 },
        mission4: { completed: false, revealed: false, revealDate: null, requiredBNB: 0.025, requiredSOL: 0.25 }
    };
}

// ====== API CALL ======
async function apiCall(endpoint, method, body) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    try {
        const res = await fetch('/api' + endpoint, options);
        return await res.json();
    } catch (e) {
        console.error('API Error:', e);
        return { success: false, error: e.message };
    }
}

// ====== LOAD CONFIG ======
async function loadConfig() {
    try {
        const res = await fetch('/api/config');
        appConfig = await res.json();
        if (appConfig.firebaseConfig && typeof firebase !== 'undefined' && !firebase.apps.length) {
            firebase.initializeApp(appConfig.firebaseConfig);
            db = firebase.firestore();
            console.log('🔥 Firebase ready');
        }
        return true;
    } catch (e) {
        console.error('Config error:', e);
        return false;
    }
}

// ====== COINGECKO LIVE PRICES ======
async function fetchLivePrices(force = false) {
    const now = Date.now();
    if (!force && lastPricesFetch && (now - lastPricesFetch) < CONFIG.PRICES_CACHE_TTL) return;
    
    console.log('🔄 Fetching CoinGecko prices...');
    
    try {
        const allCoins = [...TOP_CRYPTOS, ...MEME_COINS];
        const ids = allCoins.map(c => c.coingeckoId).join(',');
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        allCoins.forEach(c => {
            if (data[c.coingeckoId]) {
                cryptoPrices[c.symbol] = {
                    price: data[c.coingeckoId].usd,
                    change: data[c.coingeckoId].usd_24h_change || 0
                };
            }
        });
        
        if (!cryptoPrices['TROLL']) {
            cryptoPrices['TROLL'] = { price: CONFIG.TROLL_PRICE_FALLBACK, change: 0 };
        }
        
        lastPricesFetch = now;
        console.log('✅ Prices updated');
        
        if (currentPage === 'wallet') {
            renderTopCryptos();
            renderMemeCoins();
            updateTotalBalance();
        }
    } catch (e) {
        console.error('Price error:', e);
        cryptoPrices['TROLL'] = { price: CONFIG.TROLL_PRICE_FALLBACK, change: 0 };
    }
}

// ====== SESSION MANAGEMENT ======
function saveUserSession(userId) {
    localStorage.setItem('troll_user_id', userId);
    localStorage.setItem('troll_user_ts', Date.now().toString());
}

function getSavedUser() {
    const id = localStorage.getItem('troll_user_id');
    const ts = localStorage.getItem('troll_user_ts');
    
    if (!id || !ts) return null;
    if (id.startsWith('guest_')) return null;
    
    const age = Date.now() - parseInt(ts);
    if (age < CONFIG.SESSION_TTL) {
        console.log('📦 Session restored:', id, 'age:', Math.round(age / 3600000) + 'h');
        return { id, isRestored: true };
    }
    
    console.log('⏰ Session expired');
    return null;
}

// ====== WAIT FOR TELEGRAM USER ======
async function waitForTelegramUser(maxTime = 8000) {
    console.log('⏳ Waiting for Telegram user...');
    
    if (tg) {
        tg.ready();
        tg.expand();
    }
    
    const start = Date.now();
    let attempts = 0;
    
    while (Date.now() - start < maxTime) {
        attempts++;
        
        const currentTg = window.Telegram?.WebApp;
        
        // Check initDataUnsafe
        if (currentTg?.initDataUnsafe?.user?.id) {
            const user = currentTg.initDataUnsafe.user;
            console.log(`✅ Telegram user found after ${attempts} attempts:`, user.id);
            return {
                id: user.id.toString(),
                firstName: user.first_name || 'Troll',
                lastName: user.last_name || '',
                username: user.username || '',
                initData: buildInitData(currentTg.initDataUnsafe)
            };
        }
        
        // Check initData
        if (currentTg?.initData) {
            try {
                const params = new URLSearchParams(currentTg.initData);
                const userJson = params.get('user');
                if (userJson) {
                    const user = JSON.parse(decodeURIComponent(userJson));
                    if (user?.id) {
                        console.log(`✅ Telegram user found via initData:`, user.id);
                        return {
                            id: user.id.toString(),
                            firstName: user.first_name || 'Troll',
                            lastName: user.last_name || '',
                            username: user.username || '',
                            initData: currentTg.initData
                        };
                    }
                }
            } catch (e) {}
        }
        
        await new Promise(r => setTimeout(r, 300));
    }
    
    console.log('❌ No Telegram user after', attempts, 'attempts');
    return null;
}

function buildInitData(unsafe) {
    if (!unsafe) return '';
    const data = {
        query_id: unsafe.query_id,
        user: JSON.stringify(unsafe.user),
        auth_date: unsafe.auth_date,
        hash: unsafe.hash
    };
    return Object.keys(data).filter(k => data[k]).map(k => `${k}=${encodeURIComponent(data[k])}`).join('&');
}

// ====== INIT USER - PROPER LOGIC ======
async function initUser() {
    console.log('🚀 Starting user initialization...');
    console.log('📱 Telegram WebApp:', !!tg);
    
    // 1. Try Telegram (wait up to 8 seconds)
    const tgUser = await waitForTelegramUser(8000);
    
    if (tgUser) {
        console.log('✅ Authenticating with server...');
        
        try {
            const res = await fetch('/api/init-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ initData: tgUser.initData })
            });
            
            const data = await res.json();
            
            if (data.success) {
                currentUser = data.userData;
                currentUserId = data.userId;
                isGuest = false;
                
                saveUserSession(data.userId);
                localStorage.setItem('troll_user_data', JSON.stringify(data.userData));
                
                finishInit();
                showToast(`Welcome ${data.userData.userName}!`, 'success');
                return;
            }
        } catch (e) {
            console.error('Server auth error:', e);
        }
    }
    
    // 2. Try Session Restore
    const saved = getSavedUser();
    if (saved) {
        console.log('🔄 Restoring session...');
        
        try {
            const res = await apiCall(`/users/${saved.id}`, 'GET');
            if (res.success && res.data) {
                currentUser = res.data;
                currentUserId = saved.id;
                isGuest = false;
                
                localStorage.setItem('troll_user_data', JSON.stringify(res.data));
                
                finishInit();
                showToast(`Welcome back ${res.data.userName}!`, 'success');
                return;
            }
        } catch (e) {
            console.error('Restore error:', e);
        }
    }
    
    // 3. Guest Mode (last resort)
    console.log('🎭 Creating guest user...');
    createGuestUser();
}

function createGuestUser() {
    const guestId = 'guest_' + Date.now();
    
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
    
    localStorage.setItem('troll_user_id', guestId);
    localStorage.setItem('troll_user_data', JSON.stringify(currentUser));
    
    fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: guestId, userData: currentUser })
    }).catch(() => {});
    
    finishInit();
    showToast('Guest Mode - Open in Telegram for full access', 'info');
}

function finishInit() {
    hideAllScreens();
    document.getElementById('mainApp').style.display = 'block';
    document.getElementById('bottomNav').style.display = 'flex';
    
    updateUI();
    checkAdmin();
    fetchLivePrices(true);
    updateMissionsProgress();
    
    setInterval(() => fetchLivePrices(), CONFIG.PRICES_CACHE_TTL);
}

// ====== HIDE SCREENS ======
function hideAllScreens() {
    ['onboardingScreen', 'guestOnboardingScreen', 'splashScreen'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

// ====== CHECK ADMIN ======
function checkAdmin() {
    if (currentUserId === appConfig.adminId) {
        const header = document.querySelector('.header-actions');
        if (header && !document.getElementById('adminCrownBtn')) {
            const btn = document.createElement('button');
            btn.id = 'adminCrownBtn';
            btn.className = 'icon-btn';
            btn.innerHTML = '<i class="fa-solid fa-crown" style="color: gold;"></i>';
            btn.onclick = showAdminPanel;
            header.insertBefore(btn, header.firstChild);
        }
    }
}

// ====== UPDATE UI ======
function updateUI() {
    if (!currentUser) return;
    
    document.getElementById('userName').textContent = currentUser.userName || 'User';
    document.getElementById('userIdDisplay').textContent = 'ID: ' + (currentUserId || '').slice(-8);
    
    const avatar = document.getElementById('userAvatar');
    if (avatar) {
        if (currentUser.premium) {
            avatar.innerHTML = getTrollFaceSVG();
            avatar.classList.add('avatar-premium');
        } else {
            avatar.textContent = currentUser.avatar || '🧌';
        }
    }
    
    const troll = currentUser.balances?.TROLL || 0;
    document.getElementById('trollBalance').textContent = troll.toLocaleString();
    document.getElementById('totalInvites').textContent = currentUser.inviteCount || 0;
    document.getElementById('trollEarned').textContent = (currentUser.referralEarnings || 0).toLocaleString();
    document.getElementById('inviteLink').value = getReferralLink();
    
    updateTotalBalance();
    updateSettingsUI();
    
    if (currentPage === 'wallet') {
        renderAssets();
        renderTopCryptos();
        renderMemeCoins();
    } else if (currentPage === 'airdrop') {
        renderMissionsUI();
        renderMilestones();
    }
}

function updateTotalBalance() {
    let total = 0;
    for (const asset of ALL_ASSETS) {
        const bal = currentUser.balances?.[asset.symbol] || 0;
        const price = cryptoPrices[asset.symbol]?.price || 0;
        total += bal * price;
    }
    
    const totalEl = document.getElementById('totalBalance');
    const usdEl = document.getElementById('trollUsdValue');
    
    if (totalEl) totalEl.textContent = '$' + total.toFixed(2);
    if (usdEl) {
        const trollBal = currentUser.balances?.TROLL || 0;
        const trollPrice = cryptoPrices['TROLL']?.price || CONFIG.TROLL_PRICE_FALLBACK;
        usdEl.textContent = (trollBal * trollPrice).toFixed(2);
    }
}

function getTrollFaceSVG() {
    return `<svg viewBox="0 0 100 100" width="40" height="40">
        <defs><radialGradient id="g"><stop offset="0%" stop-color="#FFD700"/><stop offset="100%" stop-color="#DAA520"/></radialGradient></defs>
        <circle cx="50" cy="50" r="48" fill="url(#g)"/><path d="M28 68 Q50 88,78 58 Q82 52,75 48 Q58 70,28 62Z" fill="#2C1810"/>
        <ellipse cx="35" cy="40" rx="8" ry="10" fill="#FFF"/><circle cx="38" cy="40" r="3"/>
        <ellipse cx="65" cy="40" rx="8" ry="10" fill="#FFF"/><circle cx="62" cy="42" r="3"/>
    </svg>`;
}

function updateSettingsUI() {
    const avatar = document.getElementById('settingsAvatar');
    if (avatar) avatar.innerHTML = currentUser.premium ? getTrollFaceSVG() : (currentUser.avatar || '🧌');
    
    document.getElementById('settingsUserName').textContent = currentUser.userName || 'User';
    document.getElementById('settingsUserId').textContent = 'ID: ' + currentUserId;
    
    const wallet = currentUser.settings?.solanaWallet;
    document.getElementById('currentSolanaWallet').textContent = wallet ? wallet.slice(0, 8) + '...' + wallet.slice(-4) : 'Not set';
    
    const tonEl = document.getElementById('tonWalletStatus');
    if (tonEl) {
        tonEl.textContent = tonConnected && tonWalletAddress ? tonWalletAddress.slice(0, 6) + '...' + tonWalletAddress.slice(-6) : 'Not connected';
        tonEl.style.color = tonConnected ? '#2ecc71' : '';
    }
}

function getReferralLink() {
    if (!currentUserId || currentUserId.startsWith('guest_')) return CONFIG.BOT_LINK;
    return CONFIG.BOT_LINK + '?startapp=' + currentUserId;
}

// ====== RENDER FUNCTIONS ======
function renderAssets() {
    const container = document.getElementById('assetsList');
    if (!container) return;
    
    container.innerHTML = ALL_ASSETS.map(asset => {
        const bal = currentUser.balances?.[asset.symbol] || 0;
        return `<div class="asset-item" onclick="showAssetDetails('${asset.symbol}')">
            <div class="asset-left"><img src="${ICONS[asset.symbol]}" class="asset-icon-img"><div class="asset-info"><h4>${asset.name}</h4><p>${asset.symbol}</p></div></div>
            <div class="asset-right"><div class="asset-balance">${bal.toLocaleString()} ${asset.symbol}</div></div>
        </div>`;
    }).join('');
}

function renderTopCryptos() {
    const container = document.getElementById('topCryptoList');
    if (!container) return;
    
    container.innerHTML = TOP_CRYPTOS.map(c => {
        const d = cryptoPrices[c.symbol] || { price: 0, change: 0 };
        const changeClass = d.change >= 0 ? 'positive' : 'negative';
        const changeSymbol = d.change >= 0 ? '+' : '';
        const decimals = c.symbol === 'TROLL' ? 5 : 2;
        
        return `<div class="crypto-item" onclick="showCryptoDetails('${c.symbol}')">
            <div class="crypto-left"><img src="${ICONS[c.symbol]}" class="crypto-icon-img"><div class="crypto-info"><h4>${c.name}</h4><p>${c.symbol}</p></div></div>
            <div class="crypto-right"><div class="crypto-price">$${d.price.toFixed(decimals)}</div><div class="crypto-change ${changeClass}">${changeSymbol}${d.change.toFixed(1)}%</div></div>
        </div>`;
    }).join('');
}

function renderMemeCoins() {
    const container = document.getElementById('memeCoinList');
    if (!container) return;
    
    container.innerHTML = MEME_COINS.map(c => {
        const d = cryptoPrices[c.symbol] || { price: 0, change: 0 };
        const changeClass = d.change >= 0 ? 'positive' : 'negative';
        const changeSymbol = d.change >= 0 ? '+' : '';
        
        return `<div class="crypto-item" onclick="showCryptoDetails('${c.symbol}')">
            <div class="crypto-left"><img src="${ICONS[c.symbol]}" class="crypto-icon-img"><div class="crypto-info"><h4>${c.name}</h4><p>${c.symbol}</p></div></div>
            <div class="crypto-right"><div class="crypto-price">$${d.price.toFixed(8)}</div><div class="crypto-change ${changeClass}">${changeSymbol}${d.change.toFixed(1)}%</div></div>
        </div>`;
    }).join('');
}

function renderMissionsUI() {
    const container = document.getElementById('withdrawalLockCard');
    if (!container) return;
    
    if (currentUser.premium) {
        container.innerHTML = `<div class="premium-unlocked-card"><div class="premium-icon-large">😏</div><h3>Premium Unlocked!</h3><p>Instant withdrawal access!</p></div>`;
        return;
    }
    
    const m = currentUser.withdrawalMissions;
    let html = `<div class="lock-header"><i class="fa-solid fa-${currentUser.withdrawalUnlocked ? 'unlock' : 'lock'}"></i><span>${currentUser.withdrawalUnlocked ? '✅ Withdrawal Available!' : '🔒 Withdrawal Locked'}</span></div><div class="missions-list-vertical">`;
    
    // Mission 1
    html += `<div class="mission-card ${m.mission1.completed ? 'completed' : ''}"><div class="mission-icon">${m.mission1.completed ? '✅' : '1️⃣'}</div><div class="mission-content"><h4>${MISSIONS.mission1.title}</h4><p>${currentUser.settings?.solanaWallet ? 'Wallet: ' + currentUser.settings.solanaWallet.slice(0,8)+'...' : MISSIONS.mission1.desc}</p>${!m.mission1.completed?'<button class="mission-action-btn" onclick="showSolanaWalletModal()">Add Wallet</button>':''}</div></div>`;
    
    // Mission 2
    if (m.mission2.revealed) {
        const prog = (m.mission2.currentAmount / 12500) * 100;
        html += `<div class="mission-card ${m.mission2.completed ? 'completed' : ''}"><div class="mission-icon">${m.mission2.completed ? '✅' : '2️⃣'}</div><div class="mission-content"><h4>${MISSIONS.mission2.title}</h4><p>${m.mission2.currentAmount.toLocaleString()} / 12,500 TROLL</p><div class="progress-bar small"><div class="progress-fill" style="width:${prog}%"></div></div><p class="mission-hint">💡 ${MISSIONS.mission2.hint}</p></div></div>`;
    } else {
        html += `<div class="mission-card mystery"><div class="mission-icon">❓</div><div class="mission-content"><h4>Mission 2: ???</h4><p>Reveals after Mission 1</p></div></div>`;
    }
    
    // Mission 3
    if (m.mission3.revealed) {
        const prog = (m.mission3.currentNewReferrals / 12) * 100;
        html += `<div class="mission-card ${m.mission3.completed ? 'completed' : ''}"><div class="mission-icon">${m.mission3.completed ? '✅' : '3️⃣'}</div><div class="mission-content"><h4>${MISSIONS.mission3.title}</h4><p>${m.mission3.currentNewReferrals} / 12 new referrals</p><div class="progress-bar small"><div class="progress-fill" style="width:${prog}%"></div></div><p class="mission-hint">💡 ${MISSIONS.mission3.hint}</p></div></div>`;
    } else {
        html += `<div class="mission-card mystery"><div class="mission-icon">❓</div><div class="mission-content"><h4>Mission 3: ???</h4><p>Reveals after Mission 2</p></div></div>`;
    }
    
    // Mission 4
    if (m.mission4.revealed) {
        const bnb = currentUser.balances?.BNB || 0;
        const sol = currentUser.balances?.SOL || 0;
        html += `<div class="mission-card ${m.mission4.completed ? 'completed' : ''}"><div class="mission-icon">${m.mission4.completed ? '✅' : '4️⃣'}</div><div class="mission-content"><h4>${MISSIONS.mission4.title}</h4><p>BNB: ${bnb.toFixed(4)}/0.025 | SOL: ${sol.toFixed(4)}/0.25</p><p class="mission-hint">💡 ${MISSIONS.mission4.hint}</p></div></div>`;
    } else if (m.mission3.completed) {
        const daysLeft = Math.max(0, Math.ceil((new Date(m.mission4.revealDate) - new Date()) / 86400000));
        html += `<div class="mission-card mystery-timer"><div class="mission-icon">⏳</div><div class="mission-content"><h4>Final Mystery Mission</h4><p>Reveals in ${daysLeft} day${daysLeft!==1?'s':''}</p><div class="timer-progress-bar"><div class="timer-fill" style="width:${((20-daysLeft)/20)*100}%"></div></div></div></div>`;
    } else {
        html += `<div class="mission-card mystery"><div class="mission-icon">❓</div><div class="mission-content"><h4>Mission 4: ???</h4><p>Reveals after Mission 3</p></div></div>`;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

function renderMilestones() {
    const container = document.getElementById('milestonesList');
    if (!container) return;
    
    container.innerHTML = MILESTONES.map(m => {
        const prog = Math.min(((currentUser.inviteCount || 0) / m.referrals) * 100, 100);
        const claimed = currentUser.claimedMilestones?.includes(m.referrals);
        const canClaim = (currentUser.inviteCount >= m.referrals) && !claimed && !m.isSpecial;
        
        return `<div class="milestone-item ${claimed ? 'claimed' : ''}">
            <div class="milestone-header"><span>${m.title}</span><span>${m.isSpecial ? '🎁' : m.reward.toLocaleString() + ' TROLL'}</span></div>
            <div class="progress-bar"><div class="progress-fill" style="width:${prog}%"></div></div>
            <div class="progress-text">${currentUser.inviteCount || 0}/${m.referrals}</div>
            ${canClaim ? `<button class="claim-btn" onclick="claimMilestone(${m.referrals})">Claim</button>` : ''}
            ${claimed ? '<p style="color:#2ecc71;text-align:center;">✓ Claimed</p>' : ''}
        </div>`;
    }).join('');
}

// ====== SAVE USER ======
async function saveUserData() {
    localStorage.setItem('troll_user_data', JSON.stringify(currentUser));
    if (!isGuest) await apiCall('/users/' + currentUserId, 'PATCH', { updates: currentUser });
}

// ====== UPDATE MISSIONS ======
async function updateMissionsProgress() {
    if (!currentUser) return;
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
            const d = new Date(); d.setDate(d.getDate() + 20);
            m.mission4.revealDate = d.toISOString();
            changed = true;
        }
    }
    if (m.mission3.completed && !m.mission4.revealed && new Date() >= new Date(m.mission4.revealDate)) {
        m.mission4.revealed = true;
        changed = true;
    }
    if (m.mission4.revealed && !m.mission4.completed) {
        const bnb = currentUser.balances?.BNB || 0;
        const sol = currentUser.balances?.SOL || 0;
        if (bnb >= m.mission4.requiredBNB || sol >= m.mission4.requiredSOL) {
            m.mission4.completed = true;
            changed = true;
        }
    }
    if (m.mission1.completed && m.mission2.completed && m.mission3.completed && m.mission4.completed && !currentUser.withdrawalUnlocked) {
        currentUser.withdrawalUnlocked = true;
        changed = true;
    }
    
    if (changed) await saveUserData();
}

// ====== ACTIONS ======
function showSolanaWalletModal() {
    const addr = prompt('Enter your Solana wallet address (TROLL token):');
    if (addr && addr.length > 30) {
        currentUser.settings = currentUser.settings || {};
        currentUser.settings.solanaWallet = addr;
        saveUserData();
        updateMissionsProgress();
        updateUI();
        if (currentPage === 'airdrop') renderMissionsUI();
        showToast('✅ Wallet saved!', 'success');
    } else if (addr) {
        showToast('Invalid address', 'error');
    }
}

function copyInviteLink() {
    const link = document.getElementById('inviteLink');
    if (link) { navigator.clipboard?.writeText(link.value); showToast('🔗 Link copied!'); }
}

function shareInviteLink() {
    const text = encodeURIComponent(`🧌 Join Troll Army! Get 1000 TROLL bonus!\n\n👉 ${getReferralLink()}`);
    tg?.openTelegramLink(`https://t.me/share/url?url=&text=${text}`);
}

async function claimMilestone(refs) {
    const m = MILESTONES.find(x => x.referrals === refs);
    if (!m || m.isSpecial) return;
    if (!currentUser.claimedMilestones) currentUser.claimedMilestones = [];
    if (currentUser.claimedMilestones.includes(refs)) return;
    if (currentUser.inviteCount < refs) { showToast('Not enough referrals', 'error'); return; }
    
    currentUser.balances.TROLL += m.reward;
    currentUser.claimedMilestones.push(refs);
    await saveUserData();
    updateUI();
    renderMilestones();
    showToast(`🎉 Claimed ${m.reward.toLocaleString()} TROLL!`, 'success');
}

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toastMessage');
    if (!toast || !msgEl) return;
    msgEl.textContent = msg;
    const icon = toast.querySelector('i');
    if (icon) icon.className = type === 'error' ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-check';
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// ====== MODALS ======
function closeModal(id) { document.getElementById(id)?.classList.remove('show'); }
function showDepositModal() { document.getElementById('depositModal')?.classList.add('show'); }
function showWithdrawModal() {
    if (!currentUser.withdrawalUnlocked && !currentUser.premium) { showToast('Complete missions first!', 'error'); return; }
    document.getElementById('withdrawModal')?.classList.add('show');
}
function showHistory() { document.getElementById('historyModal')?.classList.add('show'); }
function showNotifications() { document.getElementById('notificationsModal')?.classList.add('show'); }
function showAdminPanel() { document.getElementById('adminPanel')?.classList.remove('hidden'); }
function closeAdminPanel() { document.getElementById('adminPanel')?.classList.add('hidden'); }

// ====== NAVIGATION ======
function showWallet() {
    currentPage = 'wallet';
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById('walletSection')?.classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector('[data-tab="wallet"]')?.classList.add('active');
    renderAssets();
    renderTopCryptos();
    renderMemeCoins();
    updateTotalBalance();
}
function showAirdrop() {
    currentPage = 'airdrop';
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById('airdropSection')?.classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector('[data-tab="airdrop"]')?.classList.add('active');
    renderMissionsUI();
    renderMilestones();
}
function showSettings() {
    currentPage = 'settings';
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById('settingsSection')?.classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector('[data-tab="settings"]')?.classList.add('active');
    updateSettingsUI();
}

// ====== TON CONNECT ======
async function initTONConnect() {
    if (typeof TON_CONNECT_UI === 'undefined') return;
    try {
        tonConnectUI = new TON_CONNECT_UI.TonConnectUI({ manifestUrl: location.origin + '/tonconnect-manifest.json', buttonRootId: 'tonConnectButton' });
        const restored = await tonConnectUI.connectionRestored;
        if (restored && tonConnectUI.wallet) { tonConnected = true; tonWalletAddress = tonConnectUI.wallet.account.address; }
    } catch (e) {}
}
async function connectTONWallet() {
    if (!tonConnectUI) return;
    try {
        await tonConnectUI.openModal();
        const i = setInterval(() => {
            if (tonConnectUI.wallet) {
                clearInterval(i);
                tonConnected = true;
                tonWalletAddress = tonConnectUI.wallet.account.address;
                currentUser.tonWallet = tonWalletAddress;
                saveUserData();
                updateSettingsUI();
                showToast('✅ TON Connected!', 'success');
            }
        }, 500);
        setTimeout(() => clearInterval(i), 30000);
    } catch (e) { showToast('Connection failed', 'error'); }
}

// ====== PREMIUM ======
function showPremiumModal() { document.getElementById('premiumModal')?.classList.add('show'); }
async function buyPremium() {
    if (!tonConnected) { showToast('Connect TON wallet first', 'error'); return; }
    try {
        const tx = { validUntil: Math.floor(Date.now()/1000)+300, messages: [{ address: appConfig.ownerWallet, amount: '5000000000' }] };
        const r = await tonConnectUI.sendTransaction(tx);
        if (r.boc) {
            currentUser.premium = true;
            currentUser.avatar = '😏';
            currentUser.withdrawalUnlocked = true;
            await saveUserData();
            updateUI();
            closeModal('premiumModal');
            showToast('🎉 Premium Unlocked!', 'success');
        }
    } catch (e) { showToast('Payment failed', 'error'); }
}

// ====== HELPERS ======
function showAssetDetails(s) { showToast(`${s}: ${(currentUser.balances?.[s]||0).toLocaleString()}`, 'info'); }
function showCryptoDetails(s) { const d = cryptoPrices[s]||{price:0,change:0}; showToast(`${s}: $${d.price.toFixed(6)} (${d.change>=0?'+':''}${d.change.toFixed(1)}%)`, 'info'); }
function copyDepositAddress() { const a = document.getElementById('depositAddress')?.textContent; if (a) { navigator.clipboard?.writeText(a); showToast('Address copied!'); } }
function submitDeposit() { showToast('Deposit submitted', 'success'); closeModal('depositModal'); }
function submitWithdraw() { showToast('Withdrawal requested', 'success'); closeModal('withdrawModal'); }
function refreshPrices() { fetchLivePrices(true); showToast('Prices refreshed!', 'success'); }
function toggleLanguage() { showToast('Language changed', 'info'); }
function toggleTheme() { const t = document.documentElement.getAttribute('data-theme'); const n = t==='dark'?'light':'dark'; document.documentElement.setAttribute('data-theme', n); localStorage.setItem('theme', n); }
function logout() { if (confirm('Logout?')) { localStorage.clear(); location.reload(); } }
function openSupport() { window.open('https://t.me/TrollSupport', '_blank'); }
function showComingSoon(f) { showToast(f + ' coming soon!', 'info'); }

// ====== INIT ======
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Troll Army - Professional Version');
    
    setTimeout(() => document.getElementById('splashScreen')?.classList.add('hidden'), 2000);
    
    await loadConfig();
    await initTONConnect();
    await initUser();
});

// ====== EXPORTS ======
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

console.log('✅ Troll Army Ready! Telegram → Restore → Guest');
