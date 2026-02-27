// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title QuestAchievements
 * @notice Achievement system for recognizing user milestones
 * @dev Manages badges and achievements for quest completions
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract QuestAchievements is Ownable, Pausable {
    
    // ============================================
    // Types
    // ============================================
    
    enum Rarity {
        COMMON,
        UNCOMMON,
        RARE,
        EPIC,
        LEGENDARY
    }

    struct Achievement {
        uint256 id;
        string name;
        string description;
        string imageUri;
        Rarity rarity;
        uint256 requiredValue;
        AchievementType achievementType;
        uint256 rewardAmount;
        bool isActive;
    }

    enum AchievementType {
        QUEST_COUNT,      // Complete X quests
        STREAK_DAYS,      // Maintain X day streak
        REWARD_AMOUNT,    // Earn X total rewards
        REFERRAL_COUNT,   // Refer X users
        CLAIM_COUNT,      // Claim rewards X times
        SPECIAL           // Special achievements
    }

    struct UserAchievement {
        uint256 achievementId;
        uint256 unlockedAt;
        bool claimed;
    }

    // ============================================
    // State
    // ============================================

    // Achievement ID counter
    uint256 public nextAchievementId;

    // Achievement definitions
    mapping(uint256 => Achievement) public achievements;

    // User achievements: user => achievementId => UserAchievement
    mapping(address => mapping(uint256 => UserAchievement)) public userAchievements;

    // User's unlocked achievement IDs
    mapping(address => uint256[]) public userUnlockedIds;

    // User progress tracking: user => achievementType => currentValue
    mapping(address => mapping(AchievementType => uint256)) public userProgress;

    // Linked contracts
    address public questHub;

    // ============================================
    // Events
    // ============================================

    event AchievementCreated(
        uint256 indexed id,
        string name,
        Rarity rarity,
        AchievementType achievementType
    );

    event AchievementUnlocked(
        address indexed user,
        uint256 indexed achievementId,
        uint256 timestamp
    );

    event AchievementClaimed(
        address indexed user,
        uint256 indexed achievementId,
        uint256 reward
    );

    event ProgressUpdated(
        address indexed user,
        AchievementType achievementType,
        uint256 oldValue,
        uint256 newValue
    );

    // ============================================
    // Constructor
    // ============================================

    constructor() Ownable(msg.sender) {
        _initializeDefaultAchievements();
    }

    // ============================================
    // Modifiers
    // ============================================

    modifier onlyQuestHub() {
        require(msg.sender == questHub, "QuestAchievements: unauthorized");
        _;
    }

    // ============================================
    // Admin Functions
    // ============================================

    /**
     * @notice Set the QuestHub contract address
     * @param _questHub QuestHub contract address
     */
    function setQuestHub(address _questHub) external onlyOwner {
        require(_questHub != address(0), "QuestAchievements: zero address");
        questHub = _questHub;
    }

    /**
     * @notice Create a new achievement
     */
    function createAchievement(
        string calldata name,
        string calldata description,
        string calldata imageUri,
        Rarity rarity,
        uint256 requiredValue,
        AchievementType achievementType,
        uint256 rewardAmount
    ) external onlyOwner returns (uint256) {
        uint256 id = nextAchievementId++;
        
        achievements[id] = Achievement({
            id: id,
            name: name,
            description: description,
            imageUri: imageUri,
            rarity: rarity,
            requiredValue: requiredValue,
            achievementType: achievementType,
            rewardAmount: rewardAmount,
            isActive: true
        });

        emit AchievementCreated(id, name, rarity, achievementType);
        return id;
    }

    /**
     * @notice Deactivate an achievement
     */
    function setAchievementActive(uint256 id, bool active) external onlyOwner {
        require(id < nextAchievementId, "QuestAchievements: invalid id");
        achievements[id].isActive = active;
    }

    // ============================================
    // Progress Tracking
    // ============================================

    /**
     * @notice Update user progress (called by QuestHub)
     */
    function updateProgress(
        address user,
        AchievementType achievementType,
        uint256 newValue
    ) external onlyQuestHub whenNotPaused {
        uint256 oldValue = userProgress[user][achievementType];
        userProgress[user][achievementType] = newValue;
        
        emit ProgressUpdated(user, achievementType, oldValue, newValue);
        
        // Check for newly unlocked achievements
        _checkAndUnlockAchievements(user, achievementType, newValue);
    }

    /**
     * @notice Increment user progress
     */
    function incrementProgress(
        address user,
        AchievementType achievementType,
        uint256 amount
    ) external onlyQuestHub whenNotPaused {
        uint256 oldValue = userProgress[user][achievementType];
        uint256 newValue = oldValue + amount;
        userProgress[user][achievementType] = newValue;
        
        emit ProgressUpdated(user, achievementType, oldValue, newValue);
        
        _checkAndUnlockAchievements(user, achievementType, newValue);
    }

    // ============================================
    // Achievement Functions
    // ============================================

    /**
     * @notice Check and unlock achievements for a user
     */
    function _checkAndUnlockAchievements(
        address user,
        AchievementType achievementType,
        uint256 currentValue
    ) internal {
        for (uint256 i = 0; i < nextAchievementId; i++) {
            Achievement storage achievement = achievements[i];
            
            // Skip if not matching type or already unlocked
            if (achievement.achievementType != achievementType) continue;
            if (!achievement.isActive) continue;
            if (userAchievements[user][i].unlockedAt > 0) continue;
            
            // Check if requirement met
            if (currentValue >= achievement.requiredValue) {
                _unlockAchievement(user, i);
            }
        }
    }

    /**
     * @notice Unlock an achievement for a user
     */
    function _unlockAchievement(address user, uint256 achievementId) internal {
        userAchievements[user][achievementId] = UserAchievement({
            achievementId: achievementId,
            unlockedAt: block.timestamp,
            claimed: false
        });
        
        userUnlockedIds[user].push(achievementId);
        
        emit AchievementUnlocked(user, achievementId, block.timestamp);
    }

    /**
     * @notice Claim achievement reward
     */
    function claimAchievementReward(uint256 achievementId) external whenNotPaused {
        UserAchievement storage userAchievement = userAchievements[msg.sender][achievementId];
        
        require(userAchievement.unlockedAt > 0, "QuestAchievements: not unlocked");
        require(!userAchievement.claimed, "QuestAchievements: already claimed");
        
        Achievement storage achievement = achievements[achievementId];
        userAchievement.claimed = true;
        
        emit AchievementClaimed(msg.sender, achievementId, achievement.rewardAmount);
        
        // Note: Actual reward distribution should be handled by QuestVault
    }

    // ============================================
    // View Functions
    // ============================================

    /**
     * @notice Get all achievements
     */
    function getAllAchievements() external view returns (Achievement[] memory) {
        Achievement[] memory all = new Achievement[](nextAchievementId);
        for (uint256 i = 0; i < nextAchievementId; i++) {
            all[i] = achievements[i];
        }
        return all;
    }

    /**
     * @notice Get user's unlocked achievements
     */
    function getUserAchievements(address user) external view returns (UserAchievement[] memory) {
        uint256[] memory ids = userUnlockedIds[user];
        UserAchievement[] memory result = new UserAchievement[](ids.length);
        
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = userAchievements[user][ids[i]];
        }
        
        return result;
    }

    /**
     * @notice Get user's progress for all achievement types
     */
    function getUserProgress(address user) external view returns (uint256[] memory) {
        uint256[] memory progress = new uint256[](6);
        for (uint256 i = 0; i < 6; i++) {
            progress[i] = userProgress[user][AchievementType(i)];
        }
        return progress;
    }

    /**
     * @notice Check if user has unlocked an achievement
     */
    function hasAchievement(address user, uint256 achievementId) external view returns (bool) {
        return userAchievements[user][achievementId].unlockedAt > 0;
    }

    // ============================================
    // Internal Functions
    // ============================================

    /**
     * @notice Initialize default achievements
     */
    function _initializeDefaultAchievements() internal {
        // Quest count achievements
        _createDefaultAchievement("First Quest", "Complete your first quest", Rarity.COMMON, 1, AchievementType.QUEST_COUNT, 5 * 10**18);
        _createDefaultAchievement("Quest Novice", "Complete 10 quests", Rarity.COMMON, 10, AchievementType.QUEST_COUNT, 20 * 10**18);
        _createDefaultAchievement("Quest Expert", "Complete 50 quests", Rarity.UNCOMMON, 50, AchievementType.QUEST_COUNT, 100 * 10**18);
        _createDefaultAchievement("Quest Master", "Complete 100 quests", Rarity.RARE, 100, AchievementType.QUEST_COUNT, 250 * 10**18);
        _createDefaultAchievement("Quest Legend", "Complete 500 quests", Rarity.EPIC, 500, AchievementType.QUEST_COUNT, 1000 * 10**18);
        
        // Streak achievements
        _createDefaultAchievement("Week Warrior", "Maintain a 7-day streak", Rarity.UNCOMMON, 7, AchievementType.STREAK_DAYS, 50 * 10**18);
        _createDefaultAchievement("Month Master", "Maintain a 30-day streak", Rarity.RARE, 30, AchievementType.STREAK_DAYS, 200 * 10**18);
        _createDefaultAchievement("Eternal Flame", "Maintain a 100-day streak", Rarity.LEGENDARY, 100, AchievementType.STREAK_DAYS, 1000 * 10**18);
    }

    function _createDefaultAchievement(
        string memory name,
        string memory description,
        Rarity rarity,
        uint256 requiredValue,
        AchievementType achievementType,
        uint256 rewardAmount
    ) internal {
        uint256 id = nextAchievementId++;
        achievements[id] = Achievement({
            id: id,
            name: name,
            description: description,
            imageUri: "",
            rarity: rarity,
            requiredValue: requiredValue,
            achievementType: achievementType,
            rewardAmount: rewardAmount,
            isActive: true
        });
    }

    // ============================================
    // Pausable
    // ============================================

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
