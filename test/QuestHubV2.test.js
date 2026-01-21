const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("QuestHubV2", function () {
    let QuestToken, QuestHubV2, QuestVaultV2;
    let token, hub, vault;
    let owner, user1, user2;

    const QUEST_TYPES = {
        DAILY_LOGIN: 0,
        SOCIAL_SHARE: 1,
        REFERRAL: 2,
        STAKING: 3,
        SPECIAL: 4
    };

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

        // Link contracts
        await token.addMinter(await vault.getAddress());
        await vault.setQuestHub(await hub.getAddress());
    });

    describe("Deployment", function () {
        it("Should set the correct token address", async function () {
            expect(await hub.token()).to.equal(await token.getAddress());
        });

        it("Should set the correct vault address", async function () {
            expect(await hub.vault()).to.equal(await vault.getAddress());
        });

        it("Should set the owner correctly", async function () {
            expect(await hub.owner()).to.equal(owner.address);
        });
    });

    describe("Quest Completion", function () {
        it("Should complete daily login quest", async function () {
            await hub.connect(user1).completeQuest(QUEST_TYPES.DAILY_LOGIN);
            expect(await hub.hasCompletedToday(user1.address, QUEST_TYPES.DAILY_LOGIN)).to.be.true;
        });

        it("Should add rewards to vault after quest completion", async function () {
            await hub.connect(user1).completeQuest(QUEST_TYPES.DAILY_LOGIN);
            const pending = await vault.getPendingRewards(user1.address);
            expect(pending).to.be.gt(0);
        });

        it("Should emit QuestCompleted event", async function () {
            await expect(hub.connect(user1).completeQuest(QUEST_TYPES.DAILY_LOGIN))
                .to.emit(hub, "QuestCompleted");
        });

        it("Should revert if quest already completed today", async function () {
            await hub.connect(user1).completeQuest(QUEST_TYPES.DAILY_LOGIN);
            await expect(
                hub.connect(user1).completeQuest(QUEST_TYPES.DAILY_LOGIN)
            ).to.be.reverted;
        });

        it("Should allow different quest types on same day", async function () {
            await hub.connect(user1).completeQuest(QUEST_TYPES.DAILY_LOGIN);
            await hub.connect(user1).completeQuest(QUEST_TYPES.SOCIAL_SHARE);
            
            expect(await hub.hasCompletedToday(user1.address, QUEST_TYPES.DAILY_LOGIN)).to.be.true;
            expect(await hub.hasCompletedToday(user1.address, QUEST_TYPES.SOCIAL_SHARE)).to.be.true;
        });

        it("Should allow same quest next day", async function () {
            await hub.connect(user1).completeQuest(QUEST_TYPES.DAILY_LOGIN);
            
            // Advance time by 1 day
            await time.increase(86400);
            
            await hub.connect(user1).completeQuest(QUEST_TYPES.DAILY_LOGIN);
            expect(await hub.hasCompletedToday(user1.address, QUEST_TYPES.DAILY_LOGIN)).to.be.true;
        });
    });

    describe("Streaks", function () {
        it("Should start with zero streak", async function () {
            expect(await hub.getUserStreak(user1.address)).to.equal(0);
        });

        it("Should increment streak on consecutive daily logins", async function () {
            await hub.connect(user1).completeQuest(QUEST_TYPES.DAILY_LOGIN);
            expect(await hub.getUserStreak(user1.address)).to.equal(1);

            await time.increase(86400);
            await hub.connect(user1).completeQuest(QUEST_TYPES.DAILY_LOGIN);
            expect(await hub.getUserStreak(user1.address)).to.equal(2);
        });

        it("Should reset streak if day is missed", async function () {
            await hub.connect(user1).completeQuest(QUEST_TYPES.DAILY_LOGIN);
            expect(await hub.getUserStreak(user1.address)).to.equal(1);

            // Skip 2 days
            await time.increase(86400 * 2);
            await hub.connect(user1).completeQuest(QUEST_TYPES.DAILY_LOGIN);
            expect(await hub.getUserStreak(user1.address)).to.equal(1);
        });
    });

    describe("Quest Rewards", function () {
        it("Should return correct reward for daily login", async function () {
            const reward = await hub.getQuestReward(QUEST_TYPES.DAILY_LOGIN);
            expect(reward).to.equal(ethers.parseEther("10"));
        });

        it("Should return correct reward for social share", async function () {
            const reward = await hub.getQuestReward(QUEST_TYPES.SOCIAL_SHARE);
            expect(reward).to.equal(ethers.parseEther("20"));
        });

        it("Should return correct reward for referral", async function () {
            const reward = await hub.getQuestReward(QUEST_TYPES.REFERRAL);
            expect(reward).to.equal(ethers.parseEther("50"));
        });
    });

    describe("Pause Functionality", function () {
        it("Should allow owner to pause", async function () {
            await hub.pause();
            expect(await hub.paused()).to.be.true;
        });

        it("Should revert quest completion when paused", async function () {
            await hub.pause();
            await expect(
                hub.connect(user1).completeQuest(QUEST_TYPES.DAILY_LOGIN)
            ).to.be.reverted;
        });

        it("Should allow owner to unpause", async function () {
            await hub.pause();
            await hub.unpause();
            expect(await hub.paused()).to.be.false;
        });
    });
});
