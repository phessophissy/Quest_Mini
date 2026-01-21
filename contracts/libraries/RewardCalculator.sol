// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RewardCalculator
 * @notice Library for calculating quest rewards with multipliers
 */
library RewardCalculator {
    // Base precision for multipliers (100 = 1x)
    uint256 public constant PRECISION = 100;

    // Base rewards per quest type (in token units, multiply by 10^18 for wei)
    uint256 public constant DAILY_LOGIN_REWARD = 10;
    uint256 public constant SOCIAL_SHARE_REWARD = 20;
    uint256 public constant REFERRAL_REWARD = 50;
    uint256 public constant STAKING_REWARD = 100;
    uint256 public constant SPECIAL_REWARD = 200;

    // Booster multipliers (100 = 1x, 150 = 1.5x)
    uint256 public constant MULTIPLIER_NONE = 100;
    uint256 public constant MULTIPLIER_BRONZE = 110;
    uint256 public constant MULTIPLIER_SILVER = 125;
    uint256 public constant MULTIPLIER_GOLD = 150;
    uint256 public constant MULTIPLIER_PLATINUM = 200;
    uint256 public constant MULTIPLIER_DIAMOND = 300;

    // Streak bonus thresholds and multipliers
    uint256 public constant STREAK_BONUS_3_DAYS = 10;   // +10%
    uint256 public constant STREAK_BONUS_7_DAYS = 25;   // +25%
    uint256 public constant STREAK_BONUS_14_DAYS = 50;  // +50%
    uint256 public constant STREAK_BONUS_30_DAYS = 100; // +100%

    /**
     * @notice Get base reward for quest type
     * @param questType Quest type ID
     * @return Base reward in token units
     */
    function getBaseReward(uint8 questType) internal pure returns (uint256) {
        if (questType == 0) return DAILY_LOGIN_REWARD;
        if (questType == 1) return SOCIAL_SHARE_REWARD;
        if (questType == 2) return REFERRAL_REWARD;
        if (questType == 3) return STAKING_REWARD;
        if (questType == 4) return SPECIAL_REWARD;
        return 0;
    }

    /**
     * @notice Get booster multiplier for tier
     * @param tier Booster tier
     * @return Multiplier (100 = 1x)
     */
    function getBoosterMultiplier(uint8 tier) internal pure returns (uint256) {
        if (tier == 0) return MULTIPLIER_NONE;
        if (tier == 1) return MULTIPLIER_BRONZE;
        if (tier == 2) return MULTIPLIER_SILVER;
        if (tier == 3) return MULTIPLIER_GOLD;
        if (tier == 4) return MULTIPLIER_PLATINUM;
        if (tier == 5) return MULTIPLIER_DIAMOND;
        return MULTIPLIER_NONE;
    }

    /**
     * @notice Get streak bonus multiplier
     * @param streakDays Number of consecutive days
     * @return Bonus percentage to add (0 = no bonus)
     */
    function getStreakBonus(uint256 streakDays) internal pure returns (uint256) {
        if (streakDays >= 30) return STREAK_BONUS_30_DAYS;
        if (streakDays >= 14) return STREAK_BONUS_14_DAYS;
        if (streakDays >= 7) return STREAK_BONUS_7_DAYS;
        if (streakDays >= 3) return STREAK_BONUS_3_DAYS;
        return 0;
    }

    /**
     * @notice Calculate final reward with all multipliers
     * @param baseReward Base reward amount
     * @param boosterTier Active booster tier
     * @param streakDays Current streak
     * @return Final reward amount
     */
    function calculateFinalReward(
        uint256 baseReward,
        uint8 boosterTier,
        uint256 streakDays
    ) internal pure returns (uint256) {
        // Get multipliers
        uint256 boosterMultiplier = getBoosterMultiplier(boosterTier);
        uint256 streakBonus = getStreakBonus(streakDays);

        // Apply booster multiplier
        uint256 boostedReward = (baseReward * boosterMultiplier) / PRECISION;

        // Apply streak bonus
        uint256 streakBonusAmount = (boostedReward * streakBonus) / PRECISION;
        uint256 finalReward = boostedReward + streakBonusAmount;

        return finalReward;
    }

    /**
     * @notice Convert token units to wei (with 18 decimals)
     * @param amount Amount in token units
     * @return Amount in wei
     */
    function toWei(uint256 amount) internal pure returns (uint256) {
        return amount * 1e18;
    }

    /**
     * @notice Convert wei to token units
     * @param weiAmount Amount in wei
     * @return Amount in token units
     */
    function fromWei(uint256 weiAmount) internal pure returns (uint256) {
        return weiAmount / 1e18;
    }
}
