# Quest Mini App - FAQ

## General Questions

### What is Quest Mini?

Quest Mini is a Farcaster mini-app built on the Base blockchain. Users complete quests to earn QUEST tokens, with optional boosters to multiply their rewards.

### What blockchain is Quest Mini on?

Quest Mini runs on **Base**, an Ethereum Layer 2 network built by Coinbase. Base offers low gas fees and fast transactions.

### Do I need to pay gas fees?

Yes, all transactions require a small amount of ETH for gas. On Base, gas fees are typically very low (fractions of a cent).

---

## Wallet & Connection

### Which wallets are supported?

Any Ethereum-compatible wallet works, including:
- MetaMask
- Coinbase Wallet
- Rainbow
- WalletConnect-compatible wallets

### How do I switch to Base network?

When you connect your wallet, the app will automatically prompt you to switch to Base if you're on a different network. You can also add Base manually:

- **Network Name:** Base
- **RPC URL:** https://mainnet.base.org
- **Chain ID:** 8453
- **Currency Symbol:** ETH
- **Block Explorer:** https://basescan.org

### Why does my transaction keep failing?

Common reasons:
1. **Insufficient ETH** - You need ETH for gas fees
2. **Quest already completed** - Each quest can only be done once per day
3. **Network congestion** - Try again in a few minutes
4. **RPC issues** - The network may be temporarily slow

---

## Quests

### What types of quests are available?

| Quest Type | Reward |
|------------|--------|
| Daily Login | 10 QUEST |
| Social Share | 20 QUEST |
| Referral | 50 QUEST |
| Staking | 100 QUEST |
| Special | 200 QUEST |

### How often can I complete quests?

Each quest type can be completed **once per day**. The daily reset happens at 00:00 UTC.

### What is a streak?

A streak counts consecutive days you've completed the Daily Login quest. Longer streaks give bonus rewards:

| Streak Days | Bonus |
|-------------|-------|
| 3 days | +10% |
| 7 days | +25% |
| 14 days | +50% |
| 30 days | +100% |

### What happens if I miss a day?

If you miss a day, your streak resets to 0. You'll need to start building it again.

---

## Rewards & Claiming

### Where do my rewards go?

Rewards accumulate in the Quest Vault. They're added to your "pending rewards" balance after each quest completion.

### How do I claim my rewards?

Click the "Claim Rewards" button to receive all your pending QUEST tokens. They'll be transferred directly to your wallet.

### Is there a minimum to claim?

No minimum. You can claim any amount, though it's more gas-efficient to accumulate rewards and claim less frequently.

### Why does it say "No rewards to claim"?

This means your pending rewards balance is 0. Complete some quests first to earn rewards.

---

## Boosters

### What are boosters?

Boosters multiply your quest rewards for a limited time:

| Tier | Multiplier | Duration |
|------|------------|----------|
| Bronze | 1.1x | 30 days |
| Silver | 1.25x | 30 days |
| Gold | 1.5x | 30 days |
| Platinum | 2.0x | 30 days |
| Diamond | 3.0x | 30 days |

### How do I activate a booster?

Click on a booster tier to activate it. The booster starts immediately and lasts for 30 days.

### Can I upgrade my booster?

Yes! You can upgrade to a higher tier at any time. The expiry timer resets when you upgrade.

### Do boosters stack with streak bonuses?

Yes! Booster multipliers and streak bonuses are applied together, so you can earn even more.

---

## QUEST Token

### What is the QUEST token?

QUEST is an ERC-20 token on Base. It's earned by completing quests and can be held, traded, or used within the ecosystem.

### What's the max supply?

1 billion QUEST tokens (1,000,000,000).

### Can I buy/sell QUEST?

The token is tradeable on decentralized exchanges. Check BaseScan for available liquidity pools.

### What's the contract address?

**QuestToken:** `0xb3E3DE7248E69B1842C274fD1304d4419a734de7`

---

## Troubleshooting

### Transaction stuck pending

1. Check your wallet for pending transactions
2. Try speeding up or canceling in your wallet
3. Wait a few minutes and try again

### "Execution reverted" error

This usually means:
- Quest already completed today
- No rewards to claim
- Contract is paused

### Can't connect wallet

1. Make sure you're using a supported browser (Chrome, Firefox, Brave)
2. Check that your wallet extension is unlocked
3. Try refreshing the page
4. Disable other wallet extensions that might conflict

### App not loading

1. Clear your browser cache
2. Try a different browser
3. Check your internet connection
4. Make sure JavaScript is enabled

---

## Security

### Is Quest Mini safe?

Yes, all contracts are:
- Open source and verified on BaseScan
- Built with OpenZeppelin's audited libraries
- Designed with reentrancy protection
- Pausable for emergencies

### Do you have my private key?

**No!** Quest Mini never has access to your private keys. All transactions are signed in your wallet.

### Has the code been audited?

The smart contracts use battle-tested OpenZeppelin libraries. For specific audit information, check our GitHub repository.

---

## Support

### How can I get help?

- **GitHub:** [Report issues](https://github.com/AdekunleBamz/Quest_Mini/issues)
- **Farcaster:** @questmini
- **Discord:** Coming soon

### I found a bug!

Please report it on our GitHub Issues page with:
1. What you were trying to do
2. What happened instead
3. Your browser and wallet
4. Transaction hash (if applicable)
