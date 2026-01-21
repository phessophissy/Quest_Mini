const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("QuestVaultV2", function () {
    let QuestToken, QuestHubV2, QuestVaultV2;
    let token, hub, vault;
    let owner, user1, user2;

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

        // Link contracts
        await token.addMinter(await vault.getAddress());
        await vault.setQuestHub(await hub.getAddress());
    });

    describe("Deployment", function () {
        it("Should set the correct token address", async function () {
            expect(await vault.token()).to.equal(await token.getAddress());
        });

        it("Should set the correct hub address", async function () {
            expect(await vault.questHub()).to.equal(await hub.getAddress());
        });
    });

    describe("Reward Accumulation", function () {
        it("Should accumulate rewards after quest completion", async function () {
            await hub.connect(user1).completeQuest(DAILY_LOGIN);
            const pending = await vault.getPendingRewards(user1.address);
            expect(pending).to.be.gt(0);
        });

        it("Should accumulate multiple quest rewards", async function () {
            await hub.connect(user1).completeQuest(DAILY_LOGIN);
            const pending1 = await vault.getPendingRewards(user1.address);

            await hub.connect(user1).completeQuest(1); // Social share
            const pending2 = await vault.getPendingRewards(user1.address);

            expect(pending2).to.be.gt(pending1);
        });

        it("Should track total rewards earned", async function () {
            await hub.connect(user1).completeQuest(DAILY_LOGIN);
            const total = await vault.getTotalRewardsEarned(user1.address);
            expect(total).to.be.gt(0);
        });
    });

    describe("Claiming Rewards", function () {
        beforeEach(async function () {
            await hub.connect(user1).completeQuest(DAILY_LOGIN);
        });

        it("Should transfer tokens when claiming", async function () {
            const pendingBefore = await vault.getPendingRewards(user1.address);
            await vault.connect(user1).claimRewards();
            const balance = await token.balanceOf(user1.address);
            expect(balance).to.equal(pendingBefore);
        });

        it("Should reset pending rewards after claim", async function () {
            await vault.connect(user1).claimRewards();
            const pending = await vault.getPendingRewards(user1.address);
            expect(pending).to.equal(0);
        });

        it("Should emit RewardsClaimed event", async function () {
            await expect(vault.connect(user1).claimRewards())
                .to.emit(vault, "RewardsClaimed");
        });

        it("Should revert if no rewards to claim", async function () {
            await vault.connect(user1).claimRewards(); // Claim first
            await expect(
                vault.connect(user1).claimRewards()
            ).to.be.reverted;
        });

        it("Should not affect total earned after claim", async function () {
            const totalBefore = await vault.getTotalRewardsEarned(user1.address);
            await vault.connect(user1).claimRewards();
            const totalAfter = await vault.getTotalRewardsEarned(user1.address);
            expect(totalAfter).to.equal(totalBefore);
        });
    });

    describe("Access Control", function () {
        it("Should only allow hub to add rewards", async function () {
            await expect(
                vault.connect(user1).addRewards(user2.address, ethers.parseEther("100"))
            ).to.be.reverted;
        });

        it("Should only allow owner to set hub", async function () {
            await expect(
                vault.connect(user1).setQuestHub(user2.address)
            ).to.be.reverted;
        });
    });

    describe("Pause Functionality", function () {
        beforeEach(async function () {
            await hub.connect(user1).completeQuest(DAILY_LOGIN);
        });

        it("Should allow owner to pause", async function () {
            await vault.pause();
            expect(await vault.paused()).to.be.true;
        });

        it("Should revert claims when paused", async function () {
            await vault.pause();
            await expect(
                vault.connect(user1).claimRewards()
            ).to.be.reverted;
        });

        it("Should allow claims after unpause", async function () {
            await vault.pause();
            await vault.unpause();
            await expect(vault.connect(user1).claimRewards()).to.not.be.reverted;
        });
    });

    describe("Multiple Users", function () {
        it("Should track rewards separately per user", async function () {
            await hub.connect(user1).completeQuest(DAILY_LOGIN);
            await hub.connect(user2).completeQuest(DAILY_LOGIN);

            const pending1 = await vault.getPendingRewards(user1.address);
            const pending2 = await vault.getPendingRewards(user2.address);

            expect(pending1).to.be.gt(0);
            expect(pending2).to.be.gt(0);
        });

        it("Should not affect other users when one claims", async function () {
            await hub.connect(user1).completeQuest(DAILY_LOGIN);
            await hub.connect(user2).completeQuest(DAILY_LOGIN);

            const pending2Before = await vault.getPendingRewards(user2.address);
            await vault.connect(user1).claimRewards();
            const pending2After = await vault.getPendingRewards(user2.address);

            expect(pending2After).to.equal(pending2Before);
        });
    });
});
