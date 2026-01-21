const hre = require("hardhat");

async function main() {
    console.log("Checking Quest Mini contract status...\n");

    const addresses = {
        token: process.env.QUEST_TOKEN_ADDRESS || "0xb3E3DE7248E69B1842C274fD1304d4419a734de7",
        hub: process.env.QUEST_HUB_ADDRESS || "0x957b578Ac7469BDD5f0c4097C8B98200553b12ba",
        vault: process.env.QUEST_VAULT_ADDRESS || "0x449436Ed23595Fc95bf19181cca63cE83f0b5EC0",
        booster: process.env.QUEST_BOOSTER_ADDRESS || "0xC13Ad15ac6c27477B8b56e242910A5b4cC7792Be"
    };

    const provider = hre.ethers.provider;

    // Check Token
    console.log("QuestToken:", addresses.token);
    const tokenABI = [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function totalSupply() view returns (uint256)",
        "function maxSupply() view returns (uint256)",
        "function isMinter(address) view returns (bool)"
    ];
    const token = new hre.ethers.Contract(addresses.token, tokenABI, provider);
    console.log("  Name:", await token.name());
    console.log("  Symbol:", await token.symbol());
    console.log("  Total Supply:", hre.ethers.formatEther(await token.totalSupply()), "QUEST");
    console.log("  Max Supply:", hre.ethers.formatEther(await token.maxSupply()), "QUEST");
    console.log("  Vault is Minter:", await token.isMinter(addresses.vault));
    console.log("");

    // Check Hub
    console.log("QuestHubV2:", addresses.hub);
    const hubABI = [
        "function token() view returns (address)",
        "function vault() view returns (address)",
        "function paused() view returns (bool)",
        "function getQuestReward(uint8) view returns (uint256)"
    ];
    const hub = new hre.ethers.Contract(addresses.hub, hubABI, provider);
    console.log("  Token:", await hub.token());
    console.log("  Vault:", await hub.vault());
    console.log("  Paused:", await hub.paused());
    console.log("  Daily Login Reward:", hre.ethers.formatEther(await hub.getQuestReward(0)), "QUEST");
    console.log("");

    // Check Vault
    console.log("QuestVaultV2:", addresses.vault);
    const vaultABI = [
        "function token() view returns (address)",
        "function questHub() view returns (address)",
        "function paused() view returns (bool)"
    ];
    const vault = new hre.ethers.Contract(addresses.vault, vaultABI, provider);
    console.log("  Token:", await vault.token());
    console.log("  Quest Hub:", await vault.questHub());
    console.log("  Paused:", await vault.paused());
    console.log("");

    // Check Booster
    console.log("QuestBooster:", addresses.booster);
    const boosterABI = [
        "function questHub() view returns (address)",
        "function paused() view returns (bool)",
        "function getBoosterMultiplier(uint8) view returns (uint256)"
    ];
    const booster = new hre.ethers.Contract(addresses.booster, boosterABI, provider);
    console.log("  Quest Hub:", await booster.questHub());
    console.log("  Paused:", await booster.paused());
    console.log("  Gold Multiplier:", (await booster.getBoosterMultiplier(3)).toString() + "%");
    console.log("");

    // Verify linking
    console.log("================================================");
    console.log("Contract Linking Status:");
    console.log("========================");
    
    const tokenLinked = await token.isMinter(addresses.vault);
    const vaultLinked = (await vault.questHub()).toLowerCase() === addresses.hub.toLowerCase();
    const hubTokenLinked = (await hub.token()).toLowerCase() === addresses.token.toLowerCase();
    const hubVaultLinked = (await hub.vault()).toLowerCase() === addresses.vault.toLowerCase();
    const boosterLinked = (await booster.questHub()).toLowerCase() === addresses.hub.toLowerCase();

    console.log("Token -> Vault (minter):", tokenLinked ? "✓" : "✗");
    console.log("Vault -> Hub:", vaultLinked ? "✓" : "✗");
    console.log("Hub -> Token:", hubTokenLinked ? "✓" : "✗");
    console.log("Hub -> Vault:", hubVaultLinked ? "✓" : "✗");
    console.log("Booster -> Hub:", boosterLinked ? "✓" : "✗");

    const allLinked = tokenLinked && vaultLinked && hubTokenLinked && hubVaultLinked && boosterLinked;
    console.log("\nAll contracts properly linked:", allLinked ? "✓ YES" : "✗ NO");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
