# Environment Setup Guide

This guide walks you through setting up the Quest Mini development environment.

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 18.x or higher | JavaScript runtime |
| npm | 9.x or higher | Package manager |
| Git | 2.x or higher | Version control |

### Recommended Tools

- **VS Code** - Code editor with Solidity support
- **MetaMask** - Web3 wallet for testing
- **Foundry** (optional) - Additional Solidity testing

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/AdekunleBamz/Quest_Mini.git
cd Quest_Mini
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install contract dependencies
cd contracts
npm install
cd ..

# Install function dependencies (if using wallet generator)
cd function
npm install
cd ..
```

### 3. Environment Configuration

Create a `.env` file in the `contracts` directory:

```bash
cd contracts
cp .env.example .env
```

Configure the following variables:

```env
# Network RPC URLs
BASE_MAINNET_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Private key for deployment (without 0x prefix)
DEPLOYER_PRIVATE_KEY=your_private_key_here

# Block explorer API key for verification
BASESCAN_API_KEY=your_basescan_api_key

# Optional: Etherscan API key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

> ⚠️ **Security Warning**: Never commit your `.env` file or share your private keys!

## Network Configuration

### Base Mainnet

| Setting | Value |
|---------|-------|
| Chain ID | 8453 |
| RPC URL | https://mainnet.base.org |
| Explorer | https://basescan.org |
| Currency | ETH |

### Base Sepolia (Testnet)

| Setting | Value |
|---------|-------|
| Chain ID | 84532 |
| RPC URL | https://sepolia.base.org |
| Explorer | https://sepolia.basescan.org |
| Currency | ETH |
| Faucet | https://www.alchemy.com/faucets/base-sepolia |

### Adding Base to MetaMask

1. Open MetaMask
2. Click network dropdown → "Add network"
3. Select "Add network manually"
4. Enter the network details above
5. Click "Save"

## Development Workflow

### Compile Contracts

```bash
cd contracts
npx hardhat compile
```

### Run Tests

```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/QuestToken.test.js

# Run with gas reporting
REPORT_GAS=true npx hardhat test

# Run with coverage
npx hardhat coverage
```

### Deploy to Testnet

```bash
npx hardhat run scripts/deploy.js --network base-sepolia
```

### Verify Contracts

```bash
npx hardhat verify --network base-sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## Frontend Development

### Start Local Server

The frontend is a static HTML/JS application. Use any static server:

```bash
# Using Python
cd app
python -m http.server 8000

# Using Node.js (npx)
npx serve app

# Using VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

### Update Contract Addresses

After deploying contracts, update the addresses in:

1. `app/js/constants.js` - Update `CONTRACTS` object
2. `app/app.js` - Update contract config

## Troubleshooting

### Common Issues

#### "Nonce too high"
Reset your MetaMask account:
Settings → Advanced → Reset Account

#### "Insufficient funds"
Get testnet ETH from the faucet:
https://www.alchemy.com/faucets/base-sepolia

#### "Contract not verified"
Wait a few minutes after deployment, then verify:
```bash
npx hardhat verify --network base-sepolia <ADDRESS>
```

#### "Transaction underpriced"
Increase gas price in MetaMask when confirming transaction

### Getting Help

- Open an issue on GitHub
- Check existing issues for solutions
- Review the FAQ documentation

## IDE Setup

### VS Code Extensions

Install these recommended extensions:

```json
{
  "recommendations": [
    "juanblanco.solidity",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "EditorConfig.EditorConfig"
  ]
}
```

### VS Code Settings

Add to `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[solidity]": {
    "editor.defaultFormatter": "juanblanco.solidity"
  },
  "solidity.compileUsingRemoteVersion": "v0.8.20",
  "solidity.formatter": "prettier"
}
```

## Next Steps

1. ✅ Environment configured
2. 🔜 Deploy contracts to testnet
3. 🔜 Test frontend with deployed contracts
4. 🔜 Complete integration testing
5. 🔜 Deploy to mainnet

See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment instructions.
