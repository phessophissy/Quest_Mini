// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title QuestHubV2
 * @notice Central contract managing all quest completions
 * @dev FIXED: Now calls Vault to accumulate rewards automatically
 */

interface IQuestVault {
    function accumulateReward(address _user, uint256 _amount) external;
    function addAllQuestsBonus(address _user, uint256 _bonus) external;
}

contract QuestHubV2 is Ownable, Pausable, ReentrancyGuard {
    
    // Quest types
    enum QuestType { CHECKIN, ENGAGE, COMMIT, CLAIM }
    
    // User quest data
    struct UserQuests {
        uint256 lastCheckin;
        uint256 lastEngage;
        uint256 lastCommit;
        uint256 totalCompletions;
        uint256 currentStreak;
        uint256 longestStreak;
        uint256 lastActivityTimestamp;
    }
    
    // Quest rewards (in wei, 18 decimals)
    struct QuestRewards {
        uint256 checkinReward;
        uint256 engageReward;
        uint256 commitReward;
        uint256 allQuestsBonus;
    }
    
    mapping(address => UserQuests) public userQuests;
    QuestRewards public rewards;
    
    // Linked contracts
    IQuestVault public questVault;
    address public questBooster;
    
    // Stats
    uint256 public totalUsers;
    uint256 public totalQuestsCompleted;
    
    event QuestCompleted(address indexed user, QuestType questType, uint256 reward, uint256 timestamp);
    event AllQuestsCompleted(address indexed user, uint256 totalReward, uint256 streak);
    event RewardsUpdated(uint256 checkin, uint256 engage, uint256 commit, uint256 bonus);
    
    constructor() Ownable(msg.sender) {
        // Default rewards: 10 QUEST per action
        rewards = QuestRewards({
            checkinReward: 10 * 10**18,
            engageReward: 10 * 10**18,
            commitReward: 10 * 10**18,
            allQuestsBonus: 20 * 10**18  // Bonus for completing all
        });
    }
    
    modifier onlyVaultOrBooster() {
        require(
            msg.sender == address(questVault) || msg.sender == questBooster,
            "QuestHub: unauthorized"
        );
        _;
    }
    
    /**
     * @notice Set linked contract addresses
     */
    function setContracts(address _vault, address _booster) external onlyOwner {
        questVault = IQuestVault(_vault);
        questBooster = _booster;
    }
    
    /**
     * @notice Complete check-in quest - ACCUMULATES REWARD TO VAULT
     */
    function completeCheckin() external whenNotPaused nonReentrant returns (uint256) {
        UserQuests storage user = userQuests[msg.sender];
        
        if (user.lastCheckin == 0) {
            totalUsers++;
        }
        
        user.lastCheckin = block.timestamp;
        user.totalCompletions++;
        totalQuestsCompleted++;
        
        // FIXED: Accumulate reward to vault
        questVault.accumulateReward(msg.sender, rewards.checkinReward);
        
        emit QuestCompleted(msg.sender, QuestType.CHECKIN, rewards.checkinReward, block.timestamp);
        
        // Check if all quests completed, add bonus
        _checkAllQuestsBonus(msg.sender);
        
        return rewards.checkinReward;
    }
    
    /**
     * @notice Complete engage quest - ACCUMULATES REWARD TO VAULT
     */
    function completeEngage() external whenNotPaused nonReentrant returns (uint256) {
        UserQuests storage user = userQuests[msg.sender];
        
        if (user.lastEngage == 0 && user.lastCheckin == 0) {
            totalUsers++;
        }
        
        user.lastEngage = block.timestamp;
        user.totalCompletions++;
        totalQuestsCompleted++;
        
        // FIXED: Accumulate reward to vault
        questVault.accumulateReward(msg.sender, rewards.engageReward);
        
        emit QuestCompleted(msg.sender, QuestType.ENGAGE, rewards.engageReward, block.timestamp);
        
        // Check if all quests completed, add bonus
        _checkAllQuestsBonus(msg.sender);
        
        return rewards.engageReward;
    }
    
    /**
     * @notice Complete commit quest - ACCUMULATES REWARD TO VAULT
     */
    function completeCommit() external whenNotPaused nonReentrant returns (uint256) {
        UserQuests storage user = userQuests[msg.sender];
        
        if (user.lastCommit == 0 && user.lastCheckin == 0) {
            totalUsers++;
        }
        
        user.lastCommit = block.timestamp;
        user.totalCompletions++;
        totalQuestsCompleted++;
        
        // FIXED: Accumulate reward to vault
        questVault.accumulateReward(msg.sender, rewards.commitReward);
        
        emit QuestCompleted(msg.sender, QuestType.COMMIT, rewards.commitReward, block.timestamp);
        
        // Check if all quests completed, add bonus
        _checkAllQuestsBonus(msg.sender);
        
        return rewards.commitReward;
    }
    
    /**
     * @notice Internal: Check if user completed all quests and add bonus
     */
    function _checkAllQuestsBonus(address _user) internal {
        UserQuests storage user = userQuests[_user];
        uint256 sessionWindow = 1 hours;
        
        bool allDone = (
            user.lastCheckin > block.timestamp - sessionWindow &&
            user.lastEngage > block.timestamp - sessionWindow &&
            user.lastCommit > block.timestamp - sessionWindow
        );
        
        // Only give bonus once per session (check if bonus already given)
        // Simple check: if all 3 were just completed in same block or very close
        if (allDone) {
            uint256 minTime = user.lastCheckin;
            if (user.lastEngage < minTime) minTime = user.lastEngage;
            if (user.lastCommit < minTime) minTime = user.lastCommit;
            
            uint256 maxTime = user.lastCheckin;
            if (user.lastEngage > maxTime) maxTime = user.lastEngage;
            if (user.lastCommit > maxTime) maxTime = user.lastCommit;
            
            // If all completed within 5 minutes and this is the last one
            if (maxTime == block.timestamp && maxTime - minTime < 5 minutes) {
                questVault.addAllQuestsBonus(_user, rewards.allQuestsBonus);
                emit AllQuestsCompleted(_user, rewards.allQuestsBonus, user.currentStreak);
            }
        }
    }
    
    /**
     * @notice Check if user completed all quests in current session
     */
    function hasCompletedAllQuests(address _user) external view returns (bool) {
        UserQuests storage user = userQuests[_user];
        uint256 sessionWindow = 1 hours;
        
        return (
            user.lastCheckin > block.timestamp - sessionWindow &&
            user.lastEngage > block.timestamp - sessionWindow &&
            user.lastCommit > block.timestamp - sessionWindow
        );
    }
    
    /**
     * @notice Get total pending reward for completing all quests
     */
    function getTotalReward() external view returns (uint256) {
        return rewards.checkinReward + rewards.engageReward + 
               rewards.commitReward + rewards.allQuestsBonus;
    }
    
    /**
     * @notice Get user quest status
     */
    function getUserStatus(address _user) external view returns (
        uint256 completions,
        uint256 streak,
        uint256 longestStreak,
        bool checkinDone,
        bool engageDone,
        bool commitDone
    ) {
        UserQuests storage user = userQuests[_user];
        uint256 sessionWindow = 1 hours;
        
        return (
            user.totalCompletions,
            user.currentStreak,
            user.longestStreak,
            user.lastCheckin > block.timestamp - sessionWindow,
            user.lastEngage > block.timestamp - sessionWindow,
            user.lastCommit > block.timestamp - sessionWindow
        );
    }
    
    /**
     * @notice Update user streak (called by Vault after claim)
     */
    function updateStreak(address _user) external onlyVaultOrBooster {
        UserQuests storage user = userQuests[_user];
        
        // If last activity was within 24-48 hours, continue streak
        if (user.lastActivityTimestamp > block.timestamp - 48 hours) {
            user.currentStreak++;
            if (user.currentStreak > user.longestStreak) {
                user.longestStreak = user.currentStreak;
            }
        } else {
            user.currentStreak = 1;
        }
        
        user.lastActivityTimestamp = block.timestamp;
    }
    
    /**
     * @notice Update quest rewards
     */
    function setRewards(
        uint256 _checkin,
        uint256 _engage,
        uint256 _commit,
        uint256 _bonus
    ) external onlyOwner {
        rewards = QuestRewards({
            checkinReward: _checkin,
            engageReward: _engage,
            commitReward: _commit,
            allQuestsBonus: _bonus
        });
        emit RewardsUpdated(_checkin, _engage, _commit, _bonus);
    }
    
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
