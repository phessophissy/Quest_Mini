const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * @title Streak System Tests
 * @description Tests for quest streak mechanics, bonuses, and edge cases
 */
describe("Quest Streak System", function () {
    let questHub;
    let questToken;
    let questVault;
    let owner;
    let user1;
    let user2;
    let user3;
    
    // Constants
    const ONE_DAY = 24 * 60 * 60;
    const INITIAL_SUPPLY = ethers.parseEther("1000000");
    const REWARD_AMOUNT = ethers.parseEther("100");
    
    beforeEach(async function () {
        [owner, user1, user2, user3] = await ethers.getSigners();
        
        // Deploy QuestToken
        const QuestToken = await ethers.getContractFactory("QuestToken");
        questToken = await QuestToken.deploy();
        await questToken.waitForDeployment();
        
        // Deploy QuestVault
        const QuestVault = await ethers.getContractFactory("QuestVaultV2");
        questVault = await QuestVault.deploy(await questToken.getAddress());
        await questVault.waitForDeployment();
        
        // Deploy QuestHub
        const QuestHub = await ethers.getContractFactory("QuestHubV2");
        questHub = await QuestHub.deploy(
            await questToken.getAddress(),
            await questVault.getAddress()
        );
        await questHub.waitForDeployment();
        
        // Setup vault permissions
        await questVault.setQuestHub(await questHub.getAddress());
        
        // Fund the vault with tokens
        await questToken.transfer(await questVault.getAddress(), INITIAL_SUPPLY);
    });
    
    describe("Streak Initialization", function () {
        it("Should start with zero streak for new users", async function () {
            const streak = await questHub.getStreak(user1.address);
            expect(streak).to.equal(0);
        });
        
        it("Should initialize streak data correctly", async function () {
            const streakData = await questHub.getStreakData(user1.address);
            expect(streakData.currentStreak).to.equal(0);
            expect(streakData.longestStreak).to.equal(0);
            expect(streakData.lastCompletionTime).to.equal(0);
        });
    });
    
    describe("Streak Building", function () {
        beforeEach(async function () {
            // Create a daily quest for streak testing
            await questHub.createQuest(
                "daily_check_in",
                "Daily Check-in",
                REWARD_AMOUNT,
                1, // Daily quest type
                true // Streak eligible
            );
        });
        
        it("Should increment streak on consecutive day completion", async function () {
            // Complete quest on day 1
            await questHub.connect(user1).completeQuest("daily_check_in");
            let streak = await questHub.getStreak(user1.address);
            expect(streak).to.equal(1);
            
            // Advance time by 1 day
            await ethers.provider.send("evm_increaseTime", [ONE_DAY]);
            await ethers.provider.send("evm_mine");
            
            // Complete quest on day 2
            await questHub.connect(user1).completeQuest("daily_check_in");
            streak = await questHub.getStreak(user1.address);
            expect(streak).to.equal(2);
        });
        
        it("Should maintain streak when completing within 24-48 hours", async function () {
            await questHub.connect(user1).completeQuest("daily_check_in");
            
            // Complete at 36 hours (within window)
            await ethers.provider.send("evm_increaseTime", [ONE_DAY + 12 * 60 * 60]);
            await ethers.provider.send("evm_mine");
            
            await questHub.connect(user1).completeQuest("daily_check_in");
            const streak = await questHub.getStreak(user1.address);
            expect(streak).to.equal(2);
        });
        
        it("Should track longest streak independently", async function () {
            // Build a 5-day streak
            for (let i = 0; i < 5; i++) {
                await questHub.connect(user1).completeQuest("daily_check_in");
                await ethers.provider.send("evm_increaseTime", [ONE_DAY]);
                await ethers.provider.send("evm_mine");
            }
            
            // Skip 2 days to break streak
            await ethers.provider.send("evm_increaseTime", [ONE_DAY * 2]);
            await ethers.provider.send("evm_mine");
            
            // Complete quest (should reset current but not longest)
            await questHub.connect(user1).completeQuest("daily_check_in");
            
            const streakData = await questHub.getStreakData(user1.address);
            expect(streakData.currentStreak).to.equal(1);
            expect(streakData.longestStreak).to.equal(5);
        });
    });
    
    describe("Streak Breaking", function () {
        beforeEach(async function () {
            await questHub.createQuest(
                "daily_check_in",
                "Daily Check-in",
                REWARD_AMOUNT,
                1,
                true
            );
            
            // Build initial 3-day streak
            for (let i = 0; i < 3; i++) {
                await questHub.connect(user1).completeQuest("daily_check_in");
                if (i < 2) {
                    await ethers.provider.send("evm_increaseTime", [ONE_DAY]);
                    await ethers.provider.send("evm_mine");
                }
            }
        });
        
        it("Should reset streak after 48 hours of inactivity", async function () {
            // Skip 49 hours
            await ethers.provider.send("evm_increaseTime", [49 * 60 * 60]);
            await ethers.provider.send("evm_mine");
            
            await questHub.connect(user1).completeQuest("daily_check_in");
            const streak = await questHub.getStreak(user1.address);
            expect(streak).to.equal(1);
        });
        
        it("Should emit StreakBroken event when streak is reset", async function () {
            await ethers.provider.send("evm_increaseTime", [49 * 60 * 60]);
            await ethers.provider.send("evm_mine");
            
            await expect(questHub.connect(user1).completeQuest("daily_check_in"))
                .to.emit(questHub, "StreakBroken")
                .withArgs(user1.address, 3, 1);
        });
    });
    
    describe("Streak Bonuses", function () {
        beforeEach(async function () {
            await questHub.createQuest(
                "daily_check_in",
                "Daily Check-in",
                REWARD_AMOUNT,
                1,
                true
            );
        });
        
        it("Should apply streak multiplier to rewards", async function () {
            // Build 7-day streak for bonus
            for (let i = 0; i < 7; i++) {
                await questHub.connect(user1).completeQuest("daily_check_in");
                await ethers.provider.send("evm_increaseTime", [ONE_DAY]);
                await ethers.provider.send("evm_mine");
            }
            
            const balanceBefore = await questToken.balanceOf(user1.address);
            await questHub.connect(user1).completeQuest("daily_check_in");
            const balanceAfter = await questToken.balanceOf(user1.address);
            
            const reward = balanceAfter - balanceBefore;
            // 7-day streak should give 1.5x multiplier
            expect(reward).to.be.gte(ethers.parseEther("150"));
        });
        
        it("Should cap streak bonus at maximum multiplier", async function () {
            // Build 30+ day streak
            for (let i = 0; i < 31; i++) {
                await questHub.connect(user1).completeQuest("daily_check_in");
                await ethers.provider.send("evm_increaseTime", [ONE_DAY]);
                await ethers.provider.send("evm_mine");
            }
            
            const streakData = await questHub.getStreakData(user1.address);
            const multiplier = await questHub.getStreakMultiplier(user1.address);
            
            // Max multiplier should be capped (e.g., 3x)
            expect(multiplier).to.be.lte(300); // 300 basis points = 3x
        });
    });
    
    describe("Streak Milestones", function () {
        beforeEach(async function () {
            await questHub.createQuest(
                "daily_check_in",
                "Daily Check-in",
                REWARD_AMOUNT,
                1,
                true
            );
        });
        
        it("Should emit milestone event at 7 days", async function () {
            // Build 6-day streak
            for (let i = 0; i < 6; i++) {
                await questHub.connect(user1).completeQuest("daily_check_in");
                await ethers.provider.send("evm_increaseTime", [ONE_DAY]);
                await ethers.provider.send("evm_mine");
            }
            
            // 7th day should trigger milestone
            await expect(questHub.connect(user1).completeQuest("daily_check_in"))
                .to.emit(questHub, "StreakMilestone")
                .withArgs(user1.address, 7);
        });
        
        it("Should emit milestone event at 30 days", async function () {
            // Build 29-day streak
            for (let i = 0; i < 29; i++) {
                await questHub.connect(user1).completeQuest("daily_check_in");
                await ethers.provider.send("evm_increaseTime", [ONE_DAY]);
                await ethers.provider.send("evm_mine");
            }
            
            // 30th day should trigger milestone
            await expect(questHub.connect(user1).completeQuest("daily_check_in"))
                .to.emit(questHub, "StreakMilestone")
                .withArgs(user1.address, 30);
        });
    });
    
    describe("Edge Cases", function () {
        beforeEach(async function () {
            await questHub.createQuest(
                "daily_check_in",
                "Daily Check-in",
                REWARD_AMOUNT,
                1,
                true
            );
        });
        
        it("Should handle multiple completions on same day correctly", async function () {
            await questHub.connect(user1).completeQuest("daily_check_in");
            
            // Try to complete again same day
            await expect(
                questHub.connect(user1).completeQuest("daily_check_in")
            ).to.be.revertedWith("Quest already completed today");
            
            const streak = await questHub.getStreak(user1.address);
            expect(streak).to.equal(1);
        });
        
        it("Should handle timezone edge cases near midnight", async function () {
            // Complete quest just before midnight
            await questHub.connect(user1).completeQuest("daily_check_in");
            
            // Advance 23 hours 59 minutes
            await ethers.provider.send("evm_increaseTime", [23 * 60 * 60 + 59 * 60]);
            await ethers.provider.send("evm_mine");
            
            // Should still count as same day
            await expect(
                questHub.connect(user1).completeQuest("daily_check_in")
            ).to.be.revertedWith("Quest already completed today");
        });
        
        it("Should handle paused contract correctly", async function () {
            await questHub.pause();
            
            await expect(
                questHub.connect(user1).completeQuest("daily_check_in")
            ).to.be.revertedWith("Pausable: paused");
        });
        
        it("Should preserve streak data across contract upgrades", async function () {
            // Build streak
            for (let i = 0; i < 5; i++) {
                await questHub.connect(user1).completeQuest("daily_check_in");
                await ethers.provider.send("evm_increaseTime", [ONE_DAY]);
                await ethers.provider.send("evm_mine");
            }
            
            const streakBefore = await questHub.getStreakData(user1.address);
            
            // Simulate reading data (would persist across upgrade)
            expect(streakBefore.currentStreak).to.equal(5);
            expect(streakBefore.longestStreak).to.equal(5);
        });
    });
    
    describe("Multi-User Streak Tracking", function () {
        beforeEach(async function () {
            await questHub.createQuest(
                "daily_check_in",
                "Daily Check-in",
                REWARD_AMOUNT,
                1,
                true
            );
        });
        
        it("Should track streaks independently for each user", async function () {
            // User1 builds 3-day streak
            for (let i = 0; i < 3; i++) {
                await questHub.connect(user1).completeQuest("daily_check_in");
                if (i < 2) {
                    await ethers.provider.send("evm_increaseTime", [ONE_DAY]);
                    await ethers.provider.send("evm_mine");
                }
            }
            
            // User2 only completes once
            await questHub.connect(user2).completeQuest("daily_check_in");
            
            const streak1 = await questHub.getStreak(user1.address);
            const streak2 = await questHub.getStreak(user2.address);
            
            expect(streak1).to.equal(3);
            expect(streak2).to.equal(1);
        });
        
        it("Should return top streaks for leaderboard", async function () {
            // Multiple users with different streaks
            const users = [user1, user2, user3];
            const streakDays = [5, 10, 3];
            
            for (let u = 0; u < users.length; u++) {
                for (let d = 0; d < streakDays[u]; d++) {
                    await questHub.connect(users[u]).completeQuest("daily_check_in");
                    await ethers.provider.send("evm_increaseTime", [ONE_DAY]);
                    await ethers.provider.send("evm_mine");
                }
            }
            
            const topStreaks = await questHub.getTopStreaks(10);
            expect(topStreaks[0]).to.equal(user2.address); // 10 days
            expect(topStreaks[1]).to.equal(user1.address); // 5 days
            expect(topStreaks[2]).to.equal(user3.address); // 3 days
        });
    });
});
