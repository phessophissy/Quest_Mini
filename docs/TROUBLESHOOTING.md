# Quest Mini App - Troubleshooting Guide

## Common Issues and Solutions

### Connection Issues

#### "No wallet detected"

**Symptoms:**
- "Please install a wallet" message
- Connect button doesn't respond

**Solutions:**
1. Install MetaMask or another Web3 wallet
2. Ensure the wallet extension is enabled
3. Refresh the page after installing
4. Try a different browser (Chrome/Firefox recommended)

---

#### "Wrong network" warning

**Symptoms:**
- Red network badge
- Transactions fail immediately

**Solutions:**
1. Click the network switch prompt in the app
2. Manually switch in your wallet to Base (Chain ID: 8453)
3. Add Base network if not present:
   - Network Name: Base
   - RPC URL: https://mainnet.base.org
   - Chain ID: 8453
   - Symbol: ETH
   - Explorer: https://basescan.org

---

### Transaction Failures

#### "Insufficient funds for gas"

**Symptoms:**
- Transaction rejected before sending
- Error mentions gas or balance

**Solutions:**
1. Add ETH to your wallet on Base
2. Bridge ETH from Ethereum mainnet using the Base Bridge
3. Buy ETH directly on Base through Coinbase

---

#### "Execution reverted"

**Symptoms:**
- Transaction fails after sending
- Gas is consumed but action doesn't complete

**Common Causes & Fixes:**

| Error | Cause | Solution |
|-------|-------|----------|
| "Quest already completed" | Daily limit reached | Wait until next day (00:00 UTC) |
| "No rewards to claim" | Pending rewards = 0 | Complete quests first |
| "Contract paused" | Emergency pause active | Wait for unpause announcement |
| "Invalid quest type" | Bad parameter | Refresh and try again |

---

#### Transaction stuck pending

**Symptoms:**
- Transaction shows "pending" for minutes
- No confirmation or failure

**Solutions:**
1. **Wait** - Base can sometimes be slow during high traffic
2. **Speed up** - Use your wallet's "speed up" feature
3. **Cancel** - Send a 0 ETH transaction to yourself with the same nonce
4. **Check** - View transaction on BaseScan to see status

---

### Quest Issues

#### "Already completed today"

**Cause:** Each quest can only be done once per 24 hours.

**Solution:** Wait until the daily reset at 00:00 UTC.

---

#### Streak not updating

**Possible Causes:**
1. Transaction didn't confirm - check your wallet
2. Missed a day - streak resets to 0
3. UI not refreshed - reload the page

**Diagnosis:**
```javascript
// Check streak on-chain
const streak = await hub.getUserStreak(yourAddress);
console.log("Current streak:", streak.toString());
```

---

#### Rewards not showing

**Possible Causes:**
1. Transaction pending - wait for confirmation
2. View not updated - refresh the page
3. Caching issue - clear browser cache

**Verify on-chain:**
```javascript
const pending = await vault.getPendingRewards(yourAddress);
console.log("Pending:", ethers.formatEther(pending), "QUEST");
```

---

### Claim Issues

#### "No rewards to claim"

**Cause:** Your pending rewards balance is 0.

**Check:**
1. Complete quests to earn rewards
2. Verify on BaseScan that quest transactions succeeded
3. Refresh the page to update the display

---

#### Claim transaction fails

**Possible Causes:**
1. **Already claimed** - Check your token balance
2. **Contract issue** - The vault may need more minting allowance
3. **Gas estimation failed** - Try setting manual gas limit

**Manual gas limit:**
```javascript
const tx = await vault.claimRewards({ gasLimit: 200000 });
```

---

### Booster Issues

#### Booster not applying

**Symptoms:**
- Activated booster but rewards not multiplied

**Check:**
1. Verify booster is active: `isBoosterActive(address)`
2. Check expiry: `getBoosterExpiry(address)`
3. Ensure booster contract is linked to hub

---

#### Can't activate booster

**Possible Causes:**
1. Contract paused
2. Transaction failed
3. Invalid tier parameter

---

### RPC Issues

#### Slow or failing requests

**Symptoms:**
- App takes long to load
- Balance shows 0 or stale data
- Transactions time out

**Solutions:**
1. **Switch RPC** - Try alternative Base RPC endpoints:
   - `https://mainnet.base.org`
   - `https://base.llamarpc.com`
   - `https://base.publicnode.com`

2. **Check status** - Visit https://status.base.org

3. **Wait** - Network congestion may cause temporary slowdowns

---

### Browser Issues

#### App not loading

**Steps:**
1. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear cache and cookies
3. Disable browser extensions
4. Try incognito/private mode
5. Try a different browser

---

#### Wallet popup not appearing

**Solutions:**
1. Check if popup was blocked
2. Click the wallet extension icon manually
3. Ensure wallet is unlocked
4. Disable conflicting extensions

---

## Diagnostic Commands

### Check Contract Status

```javascript
// Using ethers.js in browser console
const provider = new ethers.BrowserProvider(window.ethereum);

// Check if contracts are paused
const hub = new ethers.Contract(HUB_ADDRESS, ['function paused() view returns (bool)'], provider);
console.log("Hub paused:", await hub.paused());
```

### Verify User State

```javascript
// Check user's quest status
const streak = await hub.getUserStreak(userAddress);
const pending = await vault.getPendingRewards(userAddress);
const booster = await booster.getUserBooster(userAddress);

console.log({
    streak: streak.toString(),
    pendingRewards: ethers.formatEther(pending),
    boosterTier: booster.toString()
});
```

### Test Transaction Simulation

```javascript
// Simulate before sending
try {
    await hub.completeQuest.staticCall(0); // Quest type 0
    console.log("Transaction would succeed");
} catch (error) {
    console.log("Would fail:", error.reason);
}
```

---

## Getting Help

If you've tried these solutions and still have issues:

1. **Check GitHub Issues** - Your problem may already be reported
2. **Create new issue** with:
   - Browser & wallet version
   - Steps to reproduce
   - Error messages
   - Transaction hash (if applicable)
3. **Join Discord** for community support (coming soon)

---

## Emergency Contacts

- **GitHub:** https://github.com/AdekunleBamz/Quest_Mini/issues
- **Farcaster:** @questmini
