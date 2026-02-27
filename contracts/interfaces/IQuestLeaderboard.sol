// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IQuestLeaderboard
 * @notice Interface for quest leaderboard functionality
 * @dev Tracks user rankings based on quest completions and rewards
 */
interface IQuestLeaderboard {
    
    // ============================================
    // Structs
    // ============================================
    
    struct LeaderboardEntry {
        address user;
        uint256 totalQuests;
        uint256 totalRewards;
        uint256 currentStreak;
        uint256 longestStreak;
        uint256 score;
        uint256 lastUpdate;
    }

    struct SeasonInfo {
        uint256 seasonId;
        uint256 startTime;
        uint256 endTime;
        uint256 totalParticipants;
        uint256 totalRewardsDistributed;
        bool isActive;
    }

    // ============================================
    // Events
    // ============================================
    
    /// @notice Emitted when a user's score is updated
    event ScoreUpdated(
        address indexed user,
        uint256 oldScore,
        uint256 newScore,
        uint256 newRank
    );

    /// @notice Emitted when a new season starts
    event SeasonStarted(
        uint256 indexed seasonId,
        uint256 startTime,
        uint256 endTime
    );

    /// @notice Emitted when a season ends
    event SeasonEnded(
        uint256 indexed seasonId,
        address[] topUsers,
        uint256[] rewards
    );

    /// @notice Emitted when season rewards are claimed
    event SeasonRewardClaimed(
        address indexed user,
        uint256 indexed seasonId,
        uint256 rank,
        uint256 reward
    );

    // ============================================
    // Read Functions
    // ============================================

    /**
     * @notice Get user's current leaderboard entry
     * @param user User address
     * @return entry LeaderboardEntry struct
     */
    function getUserEntry(address user) external view returns (LeaderboardEntry memory entry);

    /**
     * @notice Get user's current rank
     * @param user User address
     * @return rank Current rank (1-indexed, 0 if not ranked)
     */
    function getUserRank(address user) external view returns (uint256 rank);

    /**
     * @notice Get top N users
     * @param count Number of users to return
     * @return entries Array of LeaderboardEntry structs
     */
    function getTopUsers(uint256 count) external view returns (LeaderboardEntry[] memory entries);

    /**
     * @notice Get users around a specific rank
     * @param centerRank Center rank
     * @param range Number of users above and below
     * @return entries Array of LeaderboardEntry structs
     */
    function getUsersAroundRank(uint256 centerRank, uint256 range) 
        external view returns (LeaderboardEntry[] memory entries);

    /**
     * @notice Get current season info
     * @return info SeasonInfo struct
     */
    function getCurrentSeason() external view returns (SeasonInfo memory info);

    /**
     * @notice Get season info by ID
     * @param seasonId Season ID
     * @return info SeasonInfo struct
     */
    function getSeasonInfo(uint256 seasonId) external view returns (SeasonInfo memory info);

    /**
     * @notice Get user's season rank
     * @param user User address
     * @param seasonId Season ID
     * @return rank User's rank in that season
     */
    function getUserSeasonRank(address user, uint256 seasonId) external view returns (uint256 rank);

    /**
     * @notice Check if user has unclaimed season rewards
     * @param user User address
     * @param seasonId Season ID
     * @return hasPending Whether rewards are pending
     * @return amount Pending reward amount
     */
    function getPendingSeasonReward(address user, uint256 seasonId) 
        external view returns (bool hasPending, uint256 amount);

    /**
     * @notice Get total number of ranked users
     * @return count Total ranked users
     */
    function getTotalRankedUsers() external view returns (uint256 count);

    // ============================================
    // Write Functions
    // ============================================

    /**
     * @notice Update user's score after quest completion
     * @param user User address
     * @param questsCompleted Number of quests completed
     * @param rewardsEarned Rewards earned
     * @param currentStreak Current streak
     */
    function updateScore(
        address user,
        uint256 questsCompleted,
        uint256 rewardsEarned,
        uint256 currentStreak
    ) external;

    /**
     * @notice Claim season rewards
     * @param seasonId Season ID to claim from
     */
    function claimSeasonReward(uint256 seasonId) external;

    // ============================================
    // Admin Functions
    // ============================================

    /**
     * @notice Start a new season
     * @param duration Season duration in seconds
     */
    function startNewSeason(uint256 duration) external;

    /**
     * @notice End current season and distribute rewards
     * @param topCount Number of top users to reward
     * @param rewardAmounts Reward amounts for each rank
     */
    function endSeason(uint256 topCount, uint256[] calldata rewardAmounts) external;

    /**
     * @notice Set score calculation weights
     * @param questWeight Weight for quest completions
     * @param rewardWeight Weight for rewards earned
     * @param streakWeight Weight for streak bonus
     */
    function setScoreWeights(
        uint256 questWeight,
        uint256 rewardWeight,
        uint256 streakWeight
    ) external;
}
