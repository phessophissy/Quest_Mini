const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("QuestBooster", function () {
    let QuestToken, QuestHubV2, QuestVaultV2, QuestBooster;
    let token, hub, vault, booster;
    let owner, user1, user2;

    const TIERS = {
        NONE: 0,
        BRONZE: 1,
        SILVER: 2,
        GOLD: 3,
        PLATINUM: 4,
        DIAMOND: 5
    };

    const DAILY_LOGIN = 0;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy token
        QuestToken = await ethers.getContractFactory("QuestToken");
        token = await QuestToken.deploy("Quest Token", "QUEST", 1000000000);
        await token.waitForDeployment();

        // Deploy vault
        QuestVaultV2 = await ethers.getContractFactory("QuestVaultV2");
        vault = await QuestVaultV2.deploy(await token.getAddress());
        await vault.waitForDeployment();

        // Deploy hub
        QuestHubV2 = await ethers.getContractFactory("QuestHubV2");
        hub = await QuestHubV2.deploy(
            await token.getAddress(),
            await vault.getAddress()
        );
        await hub.waitForDeployment();

        // Deploy booster
        QuestBooster = await ethers.getContractFactory("QuestBooster");
        booster = await QuestBooster.deploy(await hub.getAddress());
        await booster.waitForDeployment();

        // Link contracts
        await token.addMinter(await vault.getAddress());
        await vault.setQuestHub(await hub.getAddress());
        await hub.setBooster(await booster.getAddress());
        await booster.setQuestHub(await hub.getAddress());
    });

    describe("Deployment", function () {
        it("Should set the correct hub address", async function () {
            expect(await booster.questHub()).to.equal(await hub.getAddress());
        });

        it("Should set the owner correctly", async function () {
            expect(await booster.owner()).to.equal(owner.address);
        });
    });

    describe("Booster Activation", function () {
        it("Should activate bronze booster", async function () {
            await booster.connect(user1).activateBooster(TIERS.BRONZE);
            expect(await booster.getUserBooster(user1.address)).to.equal(TIERS.BRONZE);
        });

        it("Should activate higher tier booster", async function () {
            await booster.connect(user1).activateBooster(TIERS.GOLD);
            expect(await booster.getUserBooster(user1.address)).to.equal(TIERS.GOLD);
        });

        it("Should emit BoosterActivated event", async function () {
            await expect(booster.connect(user1).activateBooster(TIERS.BRONZE))
                .to.emit(booster, "BoosterActivated");
        });

        it("Should set expiry timestamp", async function () {
            await booster.connect(user1).activateBooster(TIERS.BRONZE);
            const expiry = await booster.getBoosterExpiry(user1.address);
            expect(expiry).to.be.gt(0);
        });

        it("Should revert for invalid tier", async function () {
            await expect(
                booster.connect(user1).activateBooster(10)
            ).to.be.reverted;
        });
    });

    describe("Booster Status", function () {
        it("Should return true for active booster", async function () {
            await booster.connect(user1).activateBooster(TIERS.BRONZE);
            expect(await booster.isBoosterActive(user1.address)).to.be.true;
        });

        it("Should return false for no booster", async function () {
            expect(await booster.isBoosterActive(user1.address)).to.be.false;
        });

        it("Should return false after expiry", async function () {
            await booster.connect(user1).activateBooster(TIERS.BRONZE);
            
            // Advance past expiry (30 days)
            await time.increase(86400 * 31);
            
            expect(await booster.isBoosterActive(user1.address)).to.be.false;
        });
    });

    describe("Booster Multipliers", function () {
        it("Should return 100 for no booster", async function () {
            const multiplier = await booster.getBoosterMultiplier(TIERS.NONE);
            expect(multiplier).to.equal(100);
        });

        it("Should return 110 for bronze", async function () {
            const multiplier = await booster.getBoosterMultiplier(TIERS.BRONZE);
            expect(multiplier).to.equal(110);
        });

        it("Should return 125 for silver", async function () {
            const multiplier = await booster.getBoosterMultiplier(TIERS.SILVER);
            expect(multiplier).to.equal(125);
        });

        it("Should return 150 for gold", async function () {
            const multiplier = await booster.getBoosterMultiplier(TIERS.GOLD);
            expect(multiplier).to.equal(150);
        });

        it("Should return 200 for platinum", async function () {
            const multiplier = await booster.getBoosterMultiplier(TIERS.PLATINUM);
            expect(multiplier).to.equal(200);
        });

        it("Should return 300 for diamond", async function () {
            const multiplier = await booster.getBoosterMultiplier(TIERS.DIAMOND);
            expect(multiplier).to.equal(300);
        });
    });

    describe("Boosted Rewards", function () {
        it("Should apply booster multiplier to quest rewards", async function () {
            // Complete quest without booster
            await hub.connect(user1).completeQuest(DAILY_LOGIN);
            const baseReward = await vault.getPendingRewards(user1.address);

            // Claim and reset
            await vault.connect(user1).claimRewards();

            // Activate gold booster (1.5x)
            await booster.connect(user1).activateBooster(TIERS.GOLD);

            // Wait for next day
            await time.increase(86400);

            // Complete quest with booster
            await hub.connect(user1).completeQuest(DAILY_LOGIN);
            const boostedReward = await vault.getPendingRewards(user1.address);

            // Boosted should be 1.5x base
            expect(boostedReward).to.be.gt(baseReward);
        });
    });

    describe("Booster Upgrade", function () {
        it("Should allow upgrading to higher tier", async function () {
            await booster.connect(user1).activateBooster(TIERS.BRONZE);
            await booster.connect(user1).activateBooster(TIERS.GOLD);
            expect(await booster.getUserBooster(user1.address)).to.equal(TIERS.GOLD);
        });

        it("Should reset expiry on upgrade", async function () {
            await booster.connect(user1).activateBooster(TIERS.BRONZE);
            const expiry1 = await booster.getBoosterExpiry(user1.address);

            await time.increase(86400 * 10); // 10 days

            await booster.connect(user1).activateBooster(TIERS.GOLD);
            const expiry2 = await booster.getBoosterExpiry(user1.address);

            expect(expiry2).to.be.gt(expiry1);
        });
    });

    describe("Pause Functionality", function () {
        it("Should allow owner to pause", async function () {
            await booster.pause();
            expect(await booster.paused()).to.be.true;
        });

        it("Should revert activation when paused", async function () {
            await booster.pause();
            await expect(
                booster.connect(user1).activateBooster(TIERS.BRONZE)
            ).to.be.reverted;
        });
    });
});
