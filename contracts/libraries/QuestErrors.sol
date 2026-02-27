// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title QuestErrors
 * @notice Custom error definitions for Quest protocol contracts
 * @dev Using custom errors saves gas compared to revert strings
 */

// ============================================
// Authorization Errors
// ============================================

/// @notice Thrown when caller is not authorized to perform the action
error Unauthorized();

/// @notice Thrown when caller is not the contract owner
error NotOwner();

/// @notice Thrown when caller is not a registered minter
error NotMinter();

/// @notice Thrown when caller is not the Quest Hub contract
error NotQuestHub();

/// @notice Thrown when caller is not the Quest Vault contract
error NotQuestVault();

// ============================================
// Validation Errors
// ============================================

/// @notice Thrown when zero address is provided where not allowed
error ZeroAddress();

/// @notice Thrown when zero amount is provided where not allowed
error ZeroAmount();

/// @notice Thrown when an invalid quest type is specified
/// @param questType The invalid quest type provided
error InvalidQuestType(uint8 questType);

/// @notice Thrown when an invalid booster tier is specified
/// @param tier The invalid tier provided
error InvalidBoosterTier(uint8 tier);

/// @notice Thrown when array lengths don't match
/// @param expected Expected array length
/// @param actual Actual array length
error ArrayLengthMismatch(uint256 expected, uint256 actual);

/// @notice Thrown when value is out of acceptable range
/// @param value The invalid value
/// @param min Minimum acceptable value
/// @param max Maximum acceptable value
error ValueOutOfRange(uint256 value, uint256 min, uint256 max);

// ============================================
// Quest Errors
// ============================================

/// @notice Thrown when user has already completed the quest today
/// @param user The user address
/// @param questType The quest type
error QuestAlreadyCompleted(address user, uint8 questType);

/// @notice Thrown when quest is on cooldown
/// @param user The user address
/// @param questType The quest type
/// @param availableAt Timestamp when quest becomes available
error QuestOnCooldown(address user, uint8 questType, uint256 availableAt);

/// @notice Thrown when quest requirements are not met
/// @param questType The quest type
error QuestRequirementsNotMet(uint8 questType);

/// @notice Thrown when all quests haven't been completed for claiming bonus
error AllQuestsNotCompleted();

// ============================================
// Token Errors
// ============================================

/// @notice Thrown when minting would exceed max supply
/// @param requested Amount requested to mint
/// @param available Amount available to mint
error MaxSupplyExceeded(uint256 requested, uint256 available);

/// @notice Thrown when user has insufficient token balance
/// @param required Amount required
/// @param available Amount available
error InsufficientBalance(uint256 required, uint256 available);

/// @notice Thrown when token transfer fails
error TransferFailed();

// ============================================
// Reward Errors
// ============================================

/// @notice Thrown when user has no rewards to claim
error NoRewardsToClaim();

/// @notice Thrown when claiming is on cooldown
/// @param availableAt Timestamp when claiming becomes available
error ClaimCooldownActive(uint256 availableAt);

/// @notice Thrown when reward calculation overflows
error RewardCalculationOverflow();

// ============================================
// Booster Errors
// ============================================

/// @notice Thrown when user already has an active booster
/// @param currentTier Current booster tier
/// @param expiresAt Expiration timestamp
error BoosterAlreadyActive(uint8 currentTier, uint256 expiresAt);

/// @notice Thrown when booster has expired
/// @param expiredAt Expiration timestamp
error BoosterExpired(uint256 expiredAt);

/// @notice Thrown when trying to downgrade booster tier
/// @param currentTier Current tier
/// @param requestedTier Requested tier
error CannotDowngradeBooster(uint8 currentTier, uint8 requestedTier);

// ============================================
// Referral Errors
// ============================================

/// @notice Thrown when user already has a referrer set
error ReferrerAlreadySet();

/// @notice Thrown when trying to refer self
error CannotReferSelf();

/// @notice Thrown when referral chain creates a cycle
error ReferralCycleDetected();

// ============================================
// System Errors
// ============================================

/// @notice Thrown when contract is paused
error ContractPaused();

/// @notice Thrown when contract is not paused
error ContractNotPaused();

/// @notice Thrown when contract configuration is invalid
/// @param reason Description of the issue
error InvalidConfiguration(string reason);

/// @notice Thrown when external contract call fails
error ExternalCallFailed();

/// @notice Thrown when reentrancy is detected
error ReentrancyDetected();
