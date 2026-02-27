/**
 * Quest Mini - Contract Deployment Script
 * Deploys all Quest protocol contracts with proper linking
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Deployment configuration
const config = {
  // Token settings
  tokenName: "Quest Token",
  tokenSymbol: "QUEST",
  maxSupply: "1000000000", // 1 billion
  
  // Initial rewards (in tokens, will be converted to wei)
  rewards: {
    checkin: 10,
    engage: 10,
    commit: 10,
    bonus: 20
  },
  
  // Gas settings
  gasLimit: 5000000,
  
  // Output directory for deployment artifacts
  outputDir: "./deployments"
};

async function main() {
  console.log("🚀 Quest Mini Deployment Script");
  console.log("================================\n");

  // Get network info
  const network = hre.network.name;
  const chainId = (await hre.ethers.provider.getNetwork()).chainId;
  console.log(`Network: ${network} (Chain ID: ${chainId})`);

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${hre.ethers.formatEther(balance)} ETH\n`);

  // Check balance
  if (balance < hre.ethers.parseEther("0.01")) {
    throw new Error("Insufficient balance for deployment");
  }

  // Track deployed addresses
  const deployed = {};

  try {
    // Step 1: Deploy QuestToken
    console.log("📦 Deploying QuestToken...");
    const QuestToken = await hre.ethers.getContractFactory("QuestToken");
    const token = await QuestToken.deploy();
    await token.waitForDeployment();
    deployed.token = await token.getAddress();
    console.log(`   ✅ QuestToken deployed: ${deployed.token}\n`);

    // Step 2: Deploy QuestHub
    console.log("📦 Deploying QuestHub...");
    const QuestHub = await hre.ethers.getContractFactory("QuestHub");
    const hub = await QuestHub.deploy();
    await hub.waitForDeployment();
    deployed.hub = await hub.getAddress();
    console.log(`   ✅ QuestHub deployed: ${deployed.hub}\n`);

    // Step 3: Deploy QuestVault
    console.log("📦 Deploying QuestVault...");
    const QuestVault = await hre.ethers.getContractFactory("QuestVault");
    const vault = await QuestVault.deploy();
    await vault.waitForDeployment();
    deployed.vault = await vault.getAddress();
    console.log(`   ✅ QuestVault deployed: ${deployed.vault}\n`);

    // Step 4: Deploy QuestBooster
    console.log("📦 Deploying QuestBooster...");
    const QuestBooster = await hre.ethers.getContractFactory("QuestBooster");
    const booster = await QuestBooster.deploy();
    await booster.waitForDeployment();
    deployed.booster = await booster.getAddress();
    console.log(`   ✅ QuestBooster deployed: ${deployed.booster}\n`);

    // Step 5: Link contracts
    console.log("🔗 Linking contracts...");
    
    // Add vault as minter on token
    console.log("   Setting vault as minter...");
    await token.addMinter(deployed.vault);
    
    // Set contracts on QuestHub
    console.log("   Linking QuestHub...");
    await hub.setContracts(deployed.vault, deployed.booster);
    
    // Set contracts on QuestVault
    console.log("   Linking QuestVault...");
    await vault.setContracts(deployed.token, deployed.hub, deployed.booster);
    
    // Set QuestHub on Booster
    console.log("   Linking QuestBooster...");
    await booster.setQuestHub(deployed.hub);
    
    console.log("   ✅ All contracts linked\n");

    // Save deployment info
    const deployment = {
      network,
      chainId: Number(chainId),
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: {
        QuestToken: deployed.token,
        QuestHub: deployed.hub,
        QuestVault: deployed.vault,
        QuestBooster: deployed.booster
      }
    };

    // Create output directory
    if (!fs.existsSync(config.outputDir)) {
      fs.mkdirSync(config.outputDir, { recursive: true });
    }

    // Save deployment file
    const filename = `${network}-${Date.now()}.json`;
    const filepath = path.join(config.outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(deployment, null, 2));
    console.log(`📝 Deployment saved: ${filepath}\n`);

    // Print summary
    console.log("================================");
    console.log("🎉 Deployment Complete!");
    console.log("================================\n");
    console.log("Contract Addresses:");
    console.log(`  QuestToken:   ${deployed.token}`);
    console.log(`  QuestHub:     ${deployed.hub}`);
    console.log(`  QuestVault:   ${deployed.vault}`);
    console.log(`  QuestBooster: ${deployed.booster}`);
    console.log("\n📋 Next Steps:");
    console.log("  1. Verify contracts on block explorer");
    console.log("  2. Update frontend contract addresses");
    console.log("  3. Test contract interactions");

    return deployed;

  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    throw error;
  }
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

module.exports = { main, config };
