/**
 * Quest Mini - Contract Verification Script
 * Verifies deployed contracts on block explorer
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔍 Quest Mini Contract Verification");
  console.log("====================================\n");

  const network = hre.network.name;
  console.log(`Network: ${network}\n`);

  // Find latest deployment file
  const deploymentsDir = "./deployments";
  const files = fs.readdirSync(deploymentsDir)
    .filter(f => f.startsWith(network) && f.endsWith(".json"))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.log("❌ No deployment found for this network");
    console.log("   Run deployment script first");
    process.exit(1);
  }

  const deploymentFile = path.join(deploymentsDir, files[0]);
  console.log(`📄 Using deployment: ${deploymentFile}\n`);

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf-8"));
  const { contracts } = deployment;

  // Verify each contract
  const results = {};

  // Verify QuestToken
  console.log("📝 Verifying QuestToken...");
  try {
    await hre.run("verify:verify", {
      address: contracts.QuestToken,
      constructorArguments: []
    });
    results.QuestToken = "✅ Verified";
  } catch (error) {
    results.QuestToken = handleVerificationError(error);
  }

  // Verify QuestHub
  console.log("\n📝 Verifying QuestHub...");
  try {
    await hre.run("verify:verify", {
      address: contracts.QuestHub,
      constructorArguments: []
    });
    results.QuestHub = "✅ Verified";
  } catch (error) {
    results.QuestHub = handleVerificationError(error);
  }

  // Verify QuestVault
  console.log("\n📝 Verifying QuestVault...");
  try {
    await hre.run("verify:verify", {
      address: contracts.QuestVault,
      constructorArguments: []
    });
    results.QuestVault = "✅ Verified";
  } catch (error) {
    results.QuestVault = handleVerificationError(error);
  }

  // Verify QuestBooster
  console.log("\n📝 Verifying QuestBooster...");
  try {
    await hre.run("verify:verify", {
      address: contracts.QuestBooster,
      constructorArguments: []
    });
    results.QuestBooster = "✅ Verified";
  } catch (error) {
    results.QuestBooster = handleVerificationError(error);
  }

  // Print summary
  console.log("\n====================================");
  console.log("📊 Verification Summary");
  console.log("====================================");
  for (const [name, result] of Object.entries(results)) {
    console.log(`  ${name}: ${result}`);
  }
  console.log("====================================\n");

  // Get explorer URL
  const explorerUrls = {
    "base-mainnet": "https://basescan.org",
    "base-sepolia": "https://sepolia.basescan.org",
    "mainnet": "https://etherscan.io"
  };
  
  const explorer = explorerUrls[network] || "https://basescan.org";
  console.log(`🔗 View on explorer: ${explorer}/address/${contracts.QuestToken}`);
}

function handleVerificationError(error) {
  const message = error.message || error.toString();
  
  if (message.includes("Already Verified")) {
    return "✅ Already verified";
  }
  if (message.includes("does not have bytecode")) {
    return "❌ Contract not found";
  }
  if (message.includes("API key")) {
    return "❌ API key issue";
  }
  
  console.error("   Error:", message);
  return "❌ Failed";
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
