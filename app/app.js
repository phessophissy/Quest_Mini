// QuestCoin Mini-App - Base Chain Mainnet
// Configuration
const CONFIG = {
    chainId: 8453,
    chainName: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    explorer: 'https://basescan.org',
    currency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18
    }
};

// Contract addresses (Base Mainnet - V2 Deployed)
let CONTRACTS = {
    token: localStorage.getItem('tokenAddress') || '0xb3E3DE7248E69B1842C274fD1304d4419a734de7',
    hub: localStorage.getItem('hubAddress') || '0x957b578Ac7469BDD5f0c4097C8B98200553b12ba',
    vault: localStorage.getItem('vaultAddress') || '0x449436Ed23595Fc95bf19181cca63cE83f0b5EC0',
    booster: localStorage.getItem('boosterAddress') || '0xC13Ad15ac6c27477B8b56e242910A5b4cC7792Be'
};

// Gas settings
let GAS_LIMIT = parseInt(localStorage.getItem('gasLimit')) || 200000;

// Contract ABIs (simplified for interaction)
const ABIS = {
    hub: [
        'function completeCheckin() external returns (uint256)',
        'function completeEngage() external returns (uint256)',
        'function completeCommit() external returns (uint256)',
        'function getUserStatus(address _user) external view returns (uint256 completions, uint256 streak, uint256 longestStreak, bool checkinDone, bool engageDone, bool commitDone)',
        'function getTotalReward() external view returns (uint256)'
    ],
    vault: [
        'function claimRewards() external',
        'function getPendingRewards(address _user) external view returns (uint256)',
        'function getPreviewBoostedRewards(address _user) external view returns (uint256 base, uint256 boosted, uint256 multiplier)',
        'function getUserStats(address _user) external view returns (uint256 pending, uint256 claimed, uint256 lastClaim)',
        'function accumulateReward(address _user, uint256 _amount) external'
    ],
    booster: [
        'function getBoostMultiplier(address _user) external view returns (uint256)',
        'function getBoostBreakdown(address _user) external view returns (uint256 streakBoost, uint256 specialBoost, uint256 referralBoost, uint256 totalBoost, uint256 currentStreak, uint256 referrals)',
        'function setReferrer(address _referrer) external'
    ],
    token: [
        'function balanceOf(address account) external view returns (uint256)',
        'function symbol() external view returns (string)',
        'function decimals() external view returns (uint8)'
    ]
};

// State
let provider = null;
let signer = null;
let userAddress = null;
let contracts = {};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    checkWalletConnection();
});

// Settings
function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    panel.classList.toggle('show');
}

function loadSettings() {
    document.getElementById('tokenAddress').value = CONTRACTS.token;
    document.getElementById('hubAddress').value = CONTRACTS.hub;
    document.getElementById('vaultAddress').value = CONTRACTS.vault;
    document.getElementById('boosterAddress').value = CONTRACTS.booster;
    document.getElementById('gasLimit').value = GAS_LIMIT;
}

function saveSettings() {
    CONTRACTS.token = document.getElementById('tokenAddress').value.trim();
    CONTRACTS.hub = document.getElementById('hubAddress').value.trim();
    CONTRACTS.vault = document.getElementById('vaultAddress').value.trim();
    CONTRACTS.booster = document.getElementById('boosterAddress').value.trim();
    GAS_LIMIT = parseInt(document.getElementById('gasLimit').value) || 200000;
    
    localStorage.setItem('tokenAddress', CONTRACTS.token);
    localStorage.setItem('hubAddress', CONTRACTS.hub);
    localStorage.setItem('vaultAddress', CONTRACTS.vault);
    localStorage.setItem('boosterAddress', CONTRACTS.booster);
    localStorage.setItem('gasLimit', GAS_LIMIT.toString());
    
    showToast('Settings saved!', 'success');
    toggleSettings();
    
    if (userAddress) {
        initContracts();
        loadUserData();
    }
}

// Wallet Connection
async function checkWalletConnection() {
    if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
            await connectWallet();
        }
    }
}

async function connectWallet() {
    try {
        if (typeof window.ethereum === 'undefined') {
            showToast('Please install a Web3 wallet!', 'error');
            return;
        }
        
        // Request accounts
        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        // Check network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (parseInt(chainId, 16) !== CONFIG.chainId) {
            await switchToBase();
        }
        
        // Setup ethers
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        userAddress = accounts[0];
        
        // Update UI
        updateWalletUI();
        initContracts();
        await loadUserData();
        
        // Listen for account changes
        window.ethereum.on('accountsChanged', handleAccountChange);
        window.ethereum.on('chainChanged', () => window.location.reload());
        
    } catch (error) {
        console.error('Connection error:', error);
        showToast('Failed to connect wallet', 'error');
    }
}

async function switchToBase() {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x' + CONFIG.chainId.toString(16) }]
        });
    } catch (error) {
        if (error.code === 4902) {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: '0x' + CONFIG.chainId.toString(16),
                    chainName: CONFIG.chainName,
                    nativeCurrency: CONFIG.currency,
                    rpcUrls: [CONFIG.rpcUrl],
                    blockExplorerUrls: [CONFIG.explorer]
                }]
            });
        }
    }
}

function handleAccountChange(accounts) {
    if (accounts.length === 0) {
        userAddress = null;
        updateWalletUI();
    } else {
        userAddress = accounts[0];
        updateWalletUI();
        loadUserData();
    }
}

function updateWalletUI() {
    const btn = document.getElementById('walletBtn');
    const actionBtn = document.getElementById('actionBtn');
    
    if (userAddress) {
        const shortAddr = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
        btn.innerHTML = `<span class="wallet-status">✅</span> <span class="wallet-address-text" title="Click to copy full address">${shortAddr}</span> <span class="copy-icon">📋</span>`;
        btn.classList.remove('connect');
        btn.classList.add('connected');
        btn.onclick = copyAddressToClipboard;
        actionBtn.disabled = !areContractsConfigured();
    } else {
        btn.innerHTML = '🔗 Connect Wallet';
        btn.classList.add('connect');
        btn.classList.remove('connected');
        btn.onclick = connectWallet;
        actionBtn.disabled = true;
    }
}

// Copy wallet address to clipboard
async function copyAddressToClipboard() {
    if (!userAddress) {
        await connectWallet();
        return;
    }
    
    try {
        await navigator.clipboard.writeText(userAddress);
        showToast('📋 Address copied to clipboard!', 'success');
        
        // Visual feedback on button
        const btn = document.getElementById('walletBtn');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '✅ Copied!';
        
        setTimeout(() => {
            updateWalletUI();
        }, 1500);
        
        // Haptic feedback on mobile
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = userAddress;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            showToast('📋 Address copied!', 'success');
        } catch (err) {
            showToast('Failed to copy address', 'error');
        }
        
        document.body.removeChild(textArea);
    }
}

function areContractsConfigured() {
    return CONTRACTS.token && CONTRACTS.hub && CONTRACTS.vault && CONTRACTS.booster;
}

// Contract Initialization
function initContracts() {
    if (!areContractsConfigured()) {
        console.log('Contracts not configured');
        return;
    }
    
    contracts = {
        token: new ethers.Contract(CONTRACTS.token, ABIS.token, signer),
        hub: new ethers.Contract(CONTRACTS.hub, ABIS.hub, signer),
        vault: new ethers.Contract(CONTRACTS.vault, ABIS.vault, signer),
        booster: new ethers.Contract(CONTRACTS.booster, ABIS.booster, signer)
    };
}

// Load User Data
async function loadUserData() {
    if (!userAddress || !areContractsConfigured()) return;
    
    // Show loading skeletons
    showLoadingSkeletons(true);
    
    try {
        // Get vault stats
        const [pending, claimed, lastClaim] = await contracts.vault.getUserStats(userAddress);
        
        // Get boost info
        const multiplier = await contracts.booster.getBoostMultiplier(userAddress);
        
        // Get hub status
        const status = await contracts.hub.getUserStatus(userAddress);
        
        // Update UI
        document.getElementById('pendingRewards').textContent = 
            parseFloat(ethers.formatEther(pending)).toFixed(1);
        document.getElementById('totalClaimed').textContent = 
            parseFloat(ethers.formatEther(claimed)).toFixed(1);
        document.getElementById('currentStreak').textContent = status.streak.toString();
        
        const mult = Number(multiplier) / 100;
        document.getElementById('boostMultiplier').textContent = mult.toFixed(1) + 'x';
        document.getElementById('boostDisplay').textContent = mult.toFixed(1) + 'x';
        
        // Update boost bar (max 2.5x = 250%)
        const boostPercent = Math.min((Number(multiplier) - 100) / 150 * 100, 100);
        document.getElementById('boostFill').style.width = boostPercent + '%';
        
        // Update quest statuses
        updateQuestStatus('quest1Status', status.checkinDone);
        updateQuestStatus('quest2Status', status.engageDone);
        updateQuestStatus('quest3Status', status.commitDone);
        
        // Update streak badges
        if (typeof StreakBadges !== 'undefined') {
            StreakBadges.update(Number(status.streak));
        }
        
    } catch (error) {
        console.error('Error loading user data:', error);
        showLoadingSkeletons(false);
    }
}

// Toggle skeleton loading states
function showLoadingSkeletons(show) {
    const statCards = document.querySelectorAll('.stat-card');
    const questCards = document.querySelectorAll('.quest-card');
    
    statCards.forEach(card => {
        if (show) {
            card.classList.add('loading');
        } else {
            card.classList.remove('loading');
        }
    });
    
    questCards.forEach(card => {
        if (show) {
            card.classList.add('loading');
        } else {
            card.classList.remove('loading');
        }
    });
}

function updateQuestStatus(elementId, completed) {
    const el = document.getElementById(elementId);
    el.textContent = completed ? '✅' : '⏳';
}

// Execute All Quests
async function executeAllQuests() {
    if (!userAddress || !areContractsConfigured()) {
        showToast('Please connect wallet and configure contracts', 'error');
        return;
    }
    
    const actionBtn = document.getElementById('actionBtn');
    const txStatus = document.getElementById('txStatus');
    
    actionBtn.disabled = true;
    actionBtn.classList.add('loading');
    actionBtn.textContent = '⏳ Processing...';
    txStatus.classList.add('show');
    
    const gasOptions = { gasLimit: GAS_LIMIT };
    
    try {
        // Quest 1: Check-in
        updateTxStatus('tx1', 'pending', 'Check-in...');
        const tx1 = await contracts.hub.completeCheckin(gasOptions);
        await tx1.wait();
        updateTxStatus('tx1', 'success', 'Check-in ✅');
        updateQuestStatus('quest1Status', true);
        
        // Quest 2: Engage
        updateTxStatus('tx2', 'pending', 'Engaging...');
        const tx2 = await contracts.hub.completeEngage(gasOptions);
        await tx2.wait();
        updateTxStatus('tx2', 'success', 'Engage ✅');
        updateQuestStatus('quest2Status', true);
        
        // Quest 3: Commit
        updateTxStatus('tx3', 'pending', 'Committing...');
        const tx3 = await contracts.hub.completeCommit(gasOptions);
        await tx3.wait();
        updateTxStatus('tx3', 'success', 'Commit ✅');
        updateQuestStatus('quest3Status', true);
        
        // Quest 4: Claim
        updateTxStatus('tx4', 'pending', 'Claiming rewards...');
        const tx4 = await contracts.vault.claimRewards(gasOptions);
        await tx4.wait();
        updateTxStatus('tx4', 'success', 'Claimed ✅');
        updateQuestStatus('quest4Status', true);
        
        showToast('🎉 All quests completed!', 'success');
        await loadUserData();
        
    } catch (error) {
        console.error('Quest execution error:', error);
        showToast('Transaction failed: ' + (error.reason || error.message), 'error');
    } finally {
        actionBtn.disabled = false;
        actionBtn.classList.remove('loading');
        actionBtn.textContent = '🚀 Complete All Quests';
        
        // Hide tx status after 3 seconds
        setTimeout(() => {
            txStatus.classList.remove('show');
            resetTxStatuses();
        }, 3000);
    }
}

function updateTxStatus(id, status, text) {
    const el = document.getElementById(id);
    const spinner = el.querySelector('.tx-spinner');
    const span = el.querySelector('span');
    
    if (status === 'success') {
        spinner.style.display = 'none';
        span.textContent = text;
        span.style.color = '#10B981';
    } else if (status === 'error') {
        spinner.style.display = 'none';
        span.textContent = text;
        span.style.color = '#EF4444';
    } else {
        spinner.style.display = 'block';
        span.textContent = text;
        span.style.color = '#A1A1AA';
    }
}

function resetTxStatuses() {
    ['tx1', 'tx2', 'tx3', 'tx4'].forEach((id, i) => {
        const texts = ['Check-in...', 'Engage...', 'Commit...', 'Claim Rewards...'];
        updateTxStatus(id, 'pending', texts[i]);
        document.getElementById(id).querySelector('.tx-spinner').style.display = 'block';
    });
}

// Toast Notifications
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Individual Quest Completion
async function completeQuest(questType) {
    if (!userAddress || !areContractsConfigured()) {
        showToast('Please connect wallet first', 'error');
        return;
    }
    
    const gasOptions = { gasLimit: GAS_LIMIT };
    const questMap = {
        'checkin': { fn: 'completeCheckin', card: 'quest1', status: 'quest1Status', name: 'Check-in' },
        'engage': { fn: 'completeEngage', card: 'quest2', status: 'quest2Status', name: 'Engage' },
        'commit': { fn: 'completeCommit', card: 'quest3', status: 'quest3Status', name: 'Commit' },
        'claim': { fn: 'claimRewards', card: 'quest4', status: 'quest4Status', name: 'Claim' }
    };
    
    const quest = questMap[questType];
    if (!quest) return;
    
    const card = document.getElementById(quest.card);
    card.classList.add('processing');
    
    try {
        showToast(`⏳ ${quest.name} in progress...`, 'success');
        
        let tx;
        if (questType === 'claim') {
            tx = await contracts.vault.claimRewards(gasOptions);
        } else {
            tx = await contracts.hub[quest.fn](gasOptions);
        }
        
        await tx.wait();
        
        card.classList.remove('processing');
        card.classList.add('completed');
        updateQuestStatus(quest.status, true);
        showToast(`✅ ${quest.name} completed!`, 'success');
        
        await loadUserData();
        
    } catch (error) {
        console.error(`${quest.name} error:`, error);
        card.classList.remove('processing');
        showToast(`Failed: ${error.reason || error.message}`, 'error');
    }
}

// Farcaster Frame Integration (for embedded apps)
function initFarcasterFrame() {
    // Check if running in Farcaster frame context
    if (window.parent !== window) {
        // Post ready message to parent
        window.parent.postMessage({ type: 'frame:ready' }, '*');
        
        // Listen for frame messages
        window.addEventListener('message', (event) => {
            if (event.data.type === 'frame:connect') {
                // Handle frame-specific wallet connection
                console.log('Frame connection requested');
            }
        });
    }
}

// Initialize frame support
initFarcasterFrame();
