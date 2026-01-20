/**
 * Quest Mini App - Constants
 * Application-wide constants and configuration
 */

// Chain Configuration
export const CHAIN_ID = 8453;
export const CHAIN_NAME = 'Base';
export const CHAIN_RPC = 'https://mainnet.base.org';
export const CHAIN_EXPLORER = 'https://basescan.org';
export const NATIVE_CURRENCY = {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18
};

// Contract Addresses (Base Mainnet)
export const CONTRACTS = {
    QUEST_TOKEN: '0xb3E3DE7248E69B1842C274fD1304d4419a734de7',
    QUEST_HUB: '0x957b578Ac7469BDD5f0c4097C8B98200553b12ba',
    QUEST_VAULT: '0x449436Ed23595Fc95bf19181cca63cE83f0b5EC0',
    QUEST_BOOSTER: '0xC13Ad15ac6c27477B8b56e242910A5b4cC7792Be'
};

// Token Configuration
export const TOKEN = {
    NAME: 'Quest Token',
    SYMBOL: 'QUEST',
    DECIMALS: 18,
    MAX_SUPPLY: 1_000_000_000 // 1 billion
};

// Quest Types
export const QUEST_TYPES = {
    DAILY_LOGIN: 0,
    SOCIAL_SHARE: 1,
    REFERRAL: 2,
    STAKING: 3,
    SPECIAL: 4
};

// Quest Type Labels
export const QUEST_TYPE_LABELS = {
    [QUEST_TYPES.DAILY_LOGIN]: 'Daily Login',
    [QUEST_TYPES.SOCIAL_SHARE]: 'Social Share',
    [QUEST_TYPES.REFERRAL]: 'Referral',
    [QUEST_TYPES.STAKING]: 'Staking',
    [QUEST_TYPES.SPECIAL]: 'Special'
};

// Quest Rewards (in QUEST tokens)
export const QUEST_REWARDS = {
    [QUEST_TYPES.DAILY_LOGIN]: 10,
    [QUEST_TYPES.SOCIAL_SHARE]: 20,
    [QUEST_TYPES.REFERRAL]: 50,
    [QUEST_TYPES.STAKING]: 100,
    [QUEST_TYPES.SPECIAL]: 200
};

// Booster Tiers
export const BOOSTER_TIERS = {
    NONE: 0,
    BRONZE: 1,
    SILVER: 2,
    GOLD: 3,
    PLATINUM: 4,
    DIAMOND: 5
};

// Booster Tier Labels
export const BOOSTER_TIER_LABELS = {
    [BOOSTER_TIERS.NONE]: 'None',
    [BOOSTER_TIERS.BRONZE]: 'Bronze',
    [BOOSTER_TIERS.SILVER]: 'Silver',
    [BOOSTER_TIERS.GOLD]: 'Gold',
    [BOOSTER_TIERS.PLATINUM]: 'Platinum',
    [BOOSTER_TIERS.DIAMOND]: 'Diamond'
};

// Booster Multipliers (percentage)
export const BOOSTER_MULTIPLIERS = {
    [BOOSTER_TIERS.NONE]: 100,
    [BOOSTER_TIERS.BRONZE]: 110,
    [BOOSTER_TIERS.SILVER]: 125,
    [BOOSTER_TIERS.GOLD]: 150,
    [BOOSTER_TIERS.PLATINUM]: 200,
    [BOOSTER_TIERS.DIAMOND]: 300
};

// Streak Bonuses (percentage)
export const STREAK_BONUSES = {
    3: 10,   // 3 days = +10%
    7: 25,   // 7 days = +25%
    14: 50,  // 14 days = +50%
    30: 100  // 30 days = +100%
};

// UI Constants
export const UI = {
    TOAST_DURATION: 5000,
    DEBOUNCE_DELAY: 300,
    ANIMATION_DURATION: 300,
    MAX_DECIMALS_DISPLAY: 4,
    REFRESH_INTERVAL: 30000
};

// Error Messages
export const ERRORS = {
    WALLET_NOT_CONNECTED: 'Please connect your wallet',
    WRONG_NETWORK: 'Please switch to Base network',
    TRANSACTION_FAILED: 'Transaction failed',
    INSUFFICIENT_BALANCE: 'Insufficient balance',
    NO_REWARDS: 'No rewards to claim',
    QUEST_ALREADY_COMPLETED: 'Quest already completed today',
    COOLDOWN_ACTIVE: 'Please wait for cooldown'
};

// Success Messages
export const SUCCESS = {
    WALLET_CONNECTED: 'Wallet connected successfully',
    QUEST_COMPLETED: 'Quest completed! Rewards added.',
    REWARDS_CLAIMED: 'Rewards claimed successfully',
    BOOSTER_ACTIVATED: 'Booster activated!',
    STREAK_UPDATED: 'Streak updated!'
};

// Local Storage Keys
export const STORAGE_KEYS = {
    CONNECTED_WALLET: 'quest_connected_wallet',
    THEME: 'quest_theme',
    LAST_REFRESH: 'quest_last_refresh',
    USER_PREFERENCES: 'quest_user_prefs'
};

// API Endpoints (if using backend)
export const API = {
    BASE_URL: '/api',
    LEADERBOARD: '/api/leaderboard',
    USER_STATS: '/api/user/stats',
    QUESTS: '/api/quests'
};

// Social Links
export const SOCIAL = {
    TWITTER: 'https://twitter.com/questmini',
    DISCORD: 'https://discord.gg/questmini',
    TELEGRAM: 'https://t.me/questmini',
    FARCASTER: 'https://warpcast.com/questmini'
};

// Feature Flags
export const FEATURES = {
    STAKING_ENABLED: true,
    REFERRAL_ENABLED: true,
    LEADERBOARD_ENABLED: true,
    BOOSTERS_ENABLED: true
};
