# Quest Mini - Contract Events Reference

This document provides a comprehensive reference for all events emitted by the Quest Mini smart contracts. Events are essential for off-chain indexing, user notifications, and frontend state updates.

## Table of Contents

- [QuestToken Events](#questtoken-events)
- [QuestHub Events](#questhub-events)
- [QuestVault Events](#questvault-events)
- [QuestBooster Events](#questbooster-events)
- [Event Integration Guide](#event-integration-guide)

---

## QuestToken Events

### Transfer

Standard ERC20 transfer event.

```solidity
event Transfer(address indexed from, address indexed to, uint256 value);
```

| Parameter | Type | Indexed | Description |
|-----------|------|---------|-------------|
| from | address | ✅ | Sender address (0x0 for mints) |
| to | address | ✅ | Recipient address (0x0 for burns) |
| value | uint256 | ❌ | Amount transferred in wei |

**Example:**
```javascript
questToken.on("Transfer", (from, to, value, event) => {
    console.log(`${from} sent ${ethers.formatEther(value)} QUEST to ${to}`);
});
```

### Approval

Standard ERC20 approval event.

```solidity
event Approval(address indexed owner, address indexed spender, uint256 value);
```

| Parameter | Type | Indexed | Description |
|-----------|------|---------|-------------|
| owner | address | ✅ | Token owner address |
| spender | address | ✅ | Approved spender address |
| value | uint256 | ❌ | Approved amount in wei |

### TokensMinted

Emitted when new tokens are minted.

```solidity
event TokensMinted(address indexed to, uint256 amount, string reason);
```

| Parameter | Type | Indexed | Description |
|-----------|------|---------|-------------|
| to | address | ✅ | Recipient of minted tokens |
| amount | uint256 | ❌ | Amount minted in wei |
| reason | string | ❌ | Reason for minting |

### TokensBurned

Emitted when tokens are burned.

```solidity
event TokensBurned(address indexed from, uint256 amount);
```

---

## QuestHub Events

### QuestCreated

Emitted when a new quest is created by an admin.

```solidity
event QuestCreated(
    bytes32 indexed questId,
    string name,
    uint256 reward,
    uint8 questType,
    bool streakEligible
);
```

| Parameter | Type | Indexed | Description |
|-----------|------|---------|-------------|
| questId | bytes32 | ✅ | Unique quest identifier |
| name | string | ❌ | Human-readable quest name |
| reward | uint256 | ❌ | Base reward amount in wei |
| questType | uint8 | ❌ | 0=One-time, 1=Daily, 2=Weekly |
| streakEligible | bool | ❌ | Whether quest counts towards streak |

### QuestCompleted

Emitted when a user completes a quest.

```solidity
event QuestCompleted(
    address indexed user,
    bytes32 indexed questId,
    uint256 reward,
    uint256 timestamp
);
```

| Parameter | Type | Indexed | Description |
|-----------|------|---------|-------------|
| user | address | ✅ | User who completed the quest |
| questId | bytes32 | ✅ | Completed quest ID |
| reward | uint256 | ❌ | Actual reward earned (after multipliers) |
| timestamp | uint256 | ❌ | Block timestamp of completion |

**Example:**
```javascript
questHub.on("QuestCompleted", (user, questId, reward, timestamp, event) => {
    showNotification(`Quest completed! Earned ${ethers.formatEther(reward)} QUEST`);
    updateUserBalance(user);
});
```

### QuestUpdated

Emitted when quest parameters are modified.

```solidity
event QuestUpdated(bytes32 indexed questId, uint256 newReward, bool active);
```

### QuestDeactivated

Emitted when a quest is deactivated.

```solidity
event QuestDeactivated(bytes32 indexed questId, uint256 timestamp);
```

### StreakUpdated

Emitted when a user's streak changes.

```solidity
event StreakUpdated(address indexed user, uint256 newStreak, uint256 multiplier);
```

| Parameter | Type | Indexed | Description |
|-----------|------|---------|-------------|
| user | address | ✅ | User whose streak changed |
| newStreak | uint256 | ❌ | Current streak count |
| multiplier | uint256 | ❌ | New multiplier in basis points (100 = 1x) |

### StreakBroken

Emitted when a user loses their streak.

```solidity
event StreakBroken(address indexed user, uint256 previousStreak, uint256 newStreak);
```

### StreakMilestone

Emitted when a user hits a streak milestone.

```solidity
event StreakMilestone(address indexed user, uint256 milestone);
```

| Milestone Values | Description |
|-----------------|-------------|
| 7 | One week streak |
| 14 | Two week streak |
| 30 | One month streak |
| 100 | 100 day streak |
| 365 | One year streak |

### ReferralRegistered

Emitted when a new referral is recorded.

```solidity
event ReferralRegistered(
    address indexed referrer,
    address indexed referee,
    uint256 timestamp
);
```

### ReferralBonusPaid

Emitted when referral bonus is distributed.

```solidity
event ReferralBonusPaid(
    address indexed referrer,
    address indexed referee,
    uint256 bonus,
    uint256 level
);
```

| Parameter | Type | Indexed | Description |
|-----------|------|---------|-------------|
| referrer | address | ✅ | Address receiving bonus |
| referee | address | ✅ | Address who triggered bonus |
| bonus | uint256 | ❌ | Bonus amount in wei |
| level | uint256 | ❌ | Referral tier (1, 2, 3) |

---

## QuestVault Events

### RewardClaimed

Emitted when a user claims rewards.

```solidity
event RewardClaimed(address indexed user, uint256 amount, uint256 timestamp);
```

### RewardDeposited

Emitted when rewards are deposited into the vault.

```solidity
event RewardDeposited(address indexed from, uint256 amount);
```

### EmergencyWithdraw

Emitted during emergency withdrawals.

```solidity
event EmergencyWithdraw(address indexed to, uint256 amount, string reason);
```

### VaultPaused

Emitted when vault operations are paused.

```solidity
event VaultPaused(address indexed by, uint256 timestamp);
```

### VaultUnpaused

Emitted when vault operations resume.

```solidity
event VaultUnpaused(address indexed by, uint256 timestamp);
```

---

## QuestBooster Events

### BoosterActivated

Emitted when a user activates a booster.

```solidity
event BoosterActivated(
    address indexed user,
    uint256 indexed boosterId,
    uint256 multiplier,
    uint256 expiry
);
```

| Parameter | Type | Indexed | Description |
|-----------|------|---------|-------------|
| user | address | ✅ | User who activated booster |
| boosterId | uint256 | ✅ | Booster NFT token ID |
| multiplier | uint256 | ❌ | Boost multiplier in basis points |
| expiry | uint256 | ❌ | Unix timestamp when boost expires |

### BoosterDeactivated

Emitted when a booster expires or is manually deactivated.

```solidity
event BoosterDeactivated(address indexed user, uint256 indexed boosterId);
```

### BoosterMinted

Emitted when a new booster NFT is minted.

```solidity
event BoosterMinted(
    address indexed to,
    uint256 indexed tokenId,
    uint8 rarity,
    uint256 multiplier
);
```

| Rarity Values | Description | Typical Multiplier |
|--------------|-------------|-------------------|
| 0 | Common | 110 (1.1x) |
| 1 | Uncommon | 125 (1.25x) |
| 2 | Rare | 150 (1.5x) |
| 3 | Epic | 200 (2x) |
| 4 | Legendary | 300 (3x) |

---

## Event Integration Guide

### Listening to Events in JavaScript

```javascript
import { ethers } from "ethers";
import { QUEST_HUB_ABI, QUEST_HUB_ADDRESS } from "./contracts.js";

const provider = new ethers.BrowserProvider(window.ethereum);
const questHub = new ethers.Contract(QUEST_HUB_ADDRESS, QUEST_HUB_ABI, provider);

// Listen to QuestCompleted events
questHub.on("QuestCompleted", (user, questId, reward, timestamp, event) => {
    console.log("Quest completed:", {
        user,
        questId,
        reward: ethers.formatEther(reward),
        timestamp: new Date(Number(timestamp) * 1000),
        transactionHash: event.log.transactionHash
    });
});

// Query historical events
async function getRecentCompletions(userAddress, fromBlock = 0) {
    const filter = questHub.filters.QuestCompleted(userAddress);
    const events = await questHub.queryFilter(filter, fromBlock, "latest");
    
    return events.map(e => ({
        questId: e.args.questId,
        reward: e.args.reward,
        timestamp: e.args.timestamp,
        txHash: e.transactionHash
    }));
}
```

### Indexing with Subgraph (The Graph)

```graphql
# schema.graphql
type QuestCompletion @entity {
  id: ID!
  user: User!
  quest: Quest!
  reward: BigInt!
  timestamp: BigInt!
  transaction: Bytes!
}

type User @entity {
  id: ID!
  completions: [QuestCompletion!]! @derivedFrom(field: "user")
  totalEarned: BigInt!
  currentStreak: Int!
}
```

```typescript
// mapping.ts
export function handleQuestCompleted(event: QuestCompleted): void {
  let id = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let completion = new QuestCompletion(id);
  
  completion.user = event.params.user.toHex();
  completion.quest = event.params.questId.toHex();
  completion.reward = event.params.reward;
  completion.timestamp = event.params.timestamp;
  completion.transaction = event.transaction.hash;
  
  completion.save();
  
  // Update user stats
  let user = User.load(event.params.user.toHex());
  if (user) {
    user.totalEarned = user.totalEarned.plus(event.params.reward);
    user.save();
  }
}
```

### Event Filtering Best Practices

1. **Use indexed parameters** for filtering to reduce gas costs
2. **Batch historical queries** to avoid RPC limits
3. **Cache block numbers** to resume from last processed block
4. **Handle chain reorgs** by waiting for confirmations

```javascript
// Example: Safe event processing with reorg handling
async function processEventsWithConfirmations(fromBlock, confirmations = 12) {
    const currentBlock = await provider.getBlockNumber();
    const safeBlock = currentBlock - confirmations;
    
    if (fromBlock > safeBlock) return [];
    
    const events = await questHub.queryFilter(
        questHub.filters.QuestCompleted(),
        fromBlock,
        safeBlock
    );
    
    return events;
}
```

---

## Event Signatures

For manual decoding or verification:

| Event | Signature Hash |
|-------|----------------|
| Transfer | `0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef` |
| Approval | `0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925` |
| QuestCompleted | `0x...` (compute from signature) |
| StreakUpdated | `0x...` |

---

## Related Documentation

- [API Reference](./API.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [Contract Deployment](./DEPLOYMENT.md)
