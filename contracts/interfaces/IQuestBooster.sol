// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IQuestBooster
 * @notice Interface for the QuestBooster multiplier contract
 */
interface IQuestBooster {
    struct BoostTier {
        uint256 minStreak;
        uint256 multiplier;
    }
    
    function getBoostMultiplier(address user) external view returns (uint256);
    
    function getBoostBreakdown(address user) external view returns (
        uint256 streakBoost,
        uint256 specialBoost,
        uint256 referralBoost,
        uint256 totalBoost,
        uint256 currentStreak,
        uint256 referrals
    );
    
    function setReferrer(address referrer) external;
    function setQuestHub(address hub) external;
    function setSpecialBoost(address user, uint256 boost) external;
    function batchSetSpecialBoosts(address[] calldata users, uint256[] calldata boosts) external;
    function setBoostTier(uint256 index, uint256 minStreak, uint256 multiplier) external;
    function setReferralSettings(uint256 bonus, uint256 maxBonus) external;
    
    function referrers(address user) external view returns (address);
    function referralCount(address user) external view returns (uint256);
    function specialBoosts(address user) external view returns (uint256);
    function questHub() external view returns (address);
}
