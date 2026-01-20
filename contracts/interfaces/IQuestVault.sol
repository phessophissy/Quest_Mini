// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IQuestVault
 * @notice Interface for the QuestVault reward distribution contract
 */
interface IQuestVault {
    function accumulateReward(address user, uint256 amount) external;
    function addAllQuestsBonus(address user, uint256 bonus) external;
    function claimRewards() external;
    
    function getPendingRewards(address user) external view returns (uint256);
    function getPreviewBoostedRewards(address user) external view returns (
        uint256 base,
        uint256 boosted,
        uint256 multiplier
    );
    
    function getUserStats(address user) external view returns (
        uint256 pending,
        uint256 claimed,
        uint256 lastClaim
    );
    
    function pendingRewards(address user) external view returns (uint256);
    function totalClaimed(address user) external view returns (uint256);
    function lastClaimTime(address user) external view returns (uint256);
    
    function setContracts(address token, address hub, address booster) external;
    function pause() external;
    function unpause() external;
}
