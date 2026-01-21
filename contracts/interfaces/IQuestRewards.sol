// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IQuestRewards
 * @notice Interface for reward calculation and distribution
 */
interface IQuestRewards {
    /**
     * @notice Calculate reward amount for a quest
     * @param user Address of the user
     * @param questType Type of quest completed
     * @param baseReward Base reward amount
     * @return finalReward Final reward after multipliers
     */
    function calculateReward(
        address user,
        uint8 questType,
        uint256 baseReward
    ) external view returns (uint256 finalReward);

    /**
     * @notice Get streak bonus multiplier
     * @param streakDays Number of consecutive days
     * @return multiplier Bonus multiplier (100 = 1x, 150 = 1.5x)
     */
    function getStreakBonus(uint256 streakDays) external view returns (uint256 multiplier);

    /**
     * @notice Get total multiplier for user
     * @param user Address of the user
     * @return multiplier Combined multiplier from all sources
     */
    function getTotalMultiplier(address user) external view returns (uint256 multiplier);
}
