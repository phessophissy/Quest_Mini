// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title QuestVault
 * @notice Handles token distribution and claims
 * @dev Mints tokens to users after quest completion
 */

interface IQuestToken {
    function mint(address to, uint256 amount) external;
    function remainingSupply() external view returns (uint256);
}

interface IQuestHub {
    function hasCompletedAllQuests(address user) external view returns (bool);
    function getTotalReward() external view returns (uint256);
    function updateStreak(address user) external;
    function userQuests(address user) external view returns (
        uint256 lastCheckin,
        uint256 lastEngage,
        uint256 lastCommit,
        uint256 totalCompletions,
        uint256 currentStreak,
        uint256 longestStreak,
        uint256 lastActivityTimestamp
    );
}

interface IQuestBooster {
    function getBoostMultiplier(address user) external view returns (uint256);
}

contract QuestVault is Ownable, Pausable, ReentrancyGuard {
    
    IQuestToken public questToken;
    IQuestHub public questHub;
    IQuestBooster public questBooster;
    
    // User claim tracking
    mapping(address => uint256) public pendingRewards;
    mapping(address => uint256) public totalClaimed;
    mapping(address => uint256) public lastClaimTime;
    
    // Stats
    uint256 public totalDistributed;
    uint256 public totalClaims;
    
    event RewardAccumulated(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount, uint256 boostedAmount);
    event EmergencyWithdraw(address indexed token, uint256 amount);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @notice Set linked contract addresses
     */
    function setContracts(
        address _token,
        address _hub,
        address _booster
    ) external onlyOwner {
        questToken = IQuestToken(_token);
        questHub = IQuestHub(_hub);
        questBooster = IQuestBooster(_booster);
    }
    
    /**
     * @notice Accumulate rewards after completing individual quests
     * @param _user User address
     * @param _amount Reward amount
     */
    function accumulateReward(address _user, uint256 _amount) external whenNotPaused {
        require(
            msg.sender == address(questHub) || msg.sender == owner(),
            "QuestVault: unauthorized"
        );
        
        pendingRewards[_user] += _amount;
        emit RewardAccumulated(_user, _amount);
    }
    
    /**
     * @notice Add rewards for completing all quests
     * @param _user User address  
     * @param _bonus Bonus amount for all quests
     */
    function addAllQuestsBonus(address _user, uint256 _bonus) external whenNotPaused {
        require(
            msg.sender == address(questHub) || msg.sender == owner(),
            "QuestVault: unauthorized"
        );
        
        pendingRewards[_user] += _bonus;
        emit RewardAccumulated(_user, _bonus);
    }
    
    /**
     * @notice Claim all accumulated rewards
     */
    function claimRewards() external whenNotPaused nonReentrant {
        uint256 pending = pendingRewards[msg.sender];
        require(pending > 0, "QuestVault: no rewards to claim");
        
        // Get boost multiplier from QuestBooster
        uint256 multiplier = 100; // 100 = 1x (no boost)
        if (address(questBooster) != address(0)) {
            multiplier = questBooster.getBoostMultiplier(msg.sender);
        }
        
        // Apply boost (multiplier is in basis points, 100 = 1x, 150 = 1.5x)
        uint256 boostedAmount = (pending * multiplier) / 100;
        
        // Check remaining supply
        require(
            questToken.remainingSupply() >= boostedAmount,
            "QuestVault: insufficient token supply"
        );
        
        // Reset pending and update tracking
        pendingRewards[msg.sender] = 0;
        totalClaimed[msg.sender] += boostedAmount;
        lastClaimTime[msg.sender] = block.timestamp;
        totalDistributed += boostedAmount;
        totalClaims++;
        
        // Update streak
        questHub.updateStreak(msg.sender);
        
        // Mint tokens to user
        questToken.mint(msg.sender, boostedAmount);
        
        emit RewardClaimed(msg.sender, pending, boostedAmount);
    }
    
    /**
     * @notice Get user's pending rewards
     */
    function getPendingRewards(address _user) external view returns (uint256) {
        return pendingRewards[_user];
    }
    
    /**
     * @notice Get user's boosted pending rewards preview
     */
    function getPreviewBoostedRewards(address _user) external view returns (
        uint256 base,
        uint256 boosted,
        uint256 multiplier
    ) {
        base = pendingRewards[_user];
        multiplier = 100;
        
        if (address(questBooster) != address(0)) {
            multiplier = questBooster.getBoostMultiplier(_user);
        }
        
        boosted = (base * multiplier) / 100;
        return (base, boosted, multiplier);
    }
    
    /**
     * @notice Get user claim stats
     */
    function getUserStats(address _user) external view returns (
        uint256 pending,
        uint256 claimed,
        uint256 lastClaim
    ) {
        return (
            pendingRewards[_user],
            totalClaimed[_user],
            lastClaimTime[_user]
        );
    }
    
    /**
     * @notice Emergency functions
     */
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
    
    function emergencyWithdraw(address _token) external onlyOwner {
        if (_token == address(0)) {
            uint256 balance = address(this).balance;
            payable(owner()).transfer(balance);
            emit EmergencyWithdraw(address(0), balance);
        } else {
            uint256 balance = IQuestToken(_token).remainingSupply();
            // Note: Can't withdraw minted tokens, only stuck tokens
            emit EmergencyWithdraw(_token, balance);
        }
    }
    
    receive() external payable {}
}
