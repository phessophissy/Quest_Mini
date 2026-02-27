const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Referral Bonus System", function () {
    let QuestBooster;
    let booster;
    let owner, referrer, user1, user2, user3, user4, user5, user6;

    beforeEach(async function () {
        [owner, referrer, user1, user2, user3, user4, user5, user6] = await ethers.getSigners();

        // Deploy QuestBooster (we'll test referral functions)
        QuestBooster = await ethers.getContractFactory("QuestBooster");
        booster = await QuestBooster.deploy(ethers.ZeroAddress); // No hub for referral tests
        await booster.waitForDeployment();
    });

    describe("Setting Referrer", function () {
        it("Should allow user to set a referrer", async function () {
            await booster.connect(user1).setReferrer(referrer.address);
            expect(await booster.referrer(user1.address)).to.equal(referrer.address);
        });

        it("Should increment referrer's referral count", async function () {
            const initialCount = await booster.referralCount(referrer.address);
            await booster.connect(user1).setReferrer(referrer.address);
            expect(await booster.referralCount(referrer.address)).to.equal(initialCount + 1n);
        });

        it("Should emit ReferralSet event", async function () {
            await expect(booster.connect(user1).setReferrer(referrer.address))
                .to.emit(booster, "ReferralSet")
                .withArgs(user1.address, referrer.address);
        });

        it("Should revert when setting self as referrer", async function () {
            await expect(
                booster.connect(user1).setReferrer(user1.address)
            ).to.be.revertedWith("QuestBooster: cannot refer self");
        });

        it("Should revert when setting zero address as referrer", async function () {
            await expect(
                booster.connect(user1).setReferrer(ethers.ZeroAddress)
            ).to.be.revertedWith("QuestBooster: invalid referrer");
        });

        it("Should revert when referrer already set", async function () {
            await booster.connect(user1).setReferrer(referrer.address);
            await expect(
                booster.connect(user1).setReferrer(user2.address)
            ).to.be.revertedWith("QuestBooster: referrer already set");
        });
    });

    describe("Referral Bonus Calculation", function () {
        it("Should return 0% bonus with no referrals", async function () {
            const bonus = await booster.getReferralBonus(referrer.address);
            expect(bonus).to.equal(0);
        });

        it("Should return 5% bonus with 1 referral", async function () {
            await booster.connect(user1).setReferrer(referrer.address);
            const bonus = await booster.getReferralBonus(referrer.address);
            expect(bonus).to.equal(5);
        });

        it("Should return 10% bonus with 2 referrals", async function () {
            await booster.connect(user1).setReferrer(referrer.address);
            await booster.connect(user2).setReferrer(referrer.address);
            const bonus = await booster.getReferralBonus(referrer.address);
            expect(bonus).to.equal(10);
        });

        it("Should return 15% bonus with 3 referrals", async function () {
            await booster.connect(user1).setReferrer(referrer.address);
            await booster.connect(user2).setReferrer(referrer.address);
            await booster.connect(user3).setReferrer(referrer.address);
            const bonus = await booster.getReferralBonus(referrer.address);
            expect(bonus).to.equal(15);
        });

        it("Should cap bonus at 25% (5 referrals)", async function () {
            await booster.connect(user1).setReferrer(referrer.address);
            await booster.connect(user2).setReferrer(referrer.address);
            await booster.connect(user3).setReferrer(referrer.address);
            await booster.connect(user4).setReferrer(referrer.address);
            await booster.connect(user5).setReferrer(referrer.address);
            
            const bonus = await booster.getReferralBonus(referrer.address);
            expect(bonus).to.equal(25);
        });

        it("Should not exceed max bonus with more than 5 referrals", async function () {
            await booster.connect(user1).setReferrer(referrer.address);
            await booster.connect(user2).setReferrer(referrer.address);
            await booster.connect(user3).setReferrer(referrer.address);
            await booster.connect(user4).setReferrer(referrer.address);
            await booster.connect(user5).setReferrer(referrer.address);
            await booster.connect(user6).setReferrer(referrer.address);
            
            const bonus = await booster.getReferralBonus(referrer.address);
            expect(bonus).to.equal(25); // Still capped at 25%
        });
    });

    describe("Multiple Referrers", function () {
        it("Should track referrals independently", async function () {
            // user1 and user2 refer to referrer
            await booster.connect(user1).setReferrer(referrer.address);
            await booster.connect(user2).setReferrer(referrer.address);
            
            // user3 refers to user1
            await booster.connect(user3).setReferrer(user1.address);
            
            expect(await booster.referralCount(referrer.address)).to.equal(2);
            expect(await booster.referralCount(user1.address)).to.equal(1);
        });

        it("Should allow chain referrals", async function () {
            // referrer -> user1 -> user2 -> user3
            await booster.connect(user1).setReferrer(referrer.address);
            await booster.connect(user2).setReferrer(user1.address);
            await booster.connect(user3).setReferrer(user2.address);
            
            expect(await booster.referrer(user1.address)).to.equal(referrer.address);
            expect(await booster.referrer(user2.address)).to.equal(user1.address);
            expect(await booster.referrer(user3.address)).to.equal(user2.address);
        });
    });

    describe("Boost Multiplier Integration", function () {
        it("Should include referral bonus in total multiplier", async function () {
            // Add referrals
            await booster.connect(user1).setReferrer(referrer.address);
            await booster.connect(user2).setReferrer(referrer.address);
            
            // Get total multiplier (base 100 + referral bonus 10)
            const multiplier = await booster.getBoostMultiplier(referrer.address);
            expect(multiplier).to.be.gte(110); // At least 110% with 2 referrals
        });
    });

    describe("Edge Cases", function () {
        it("Should handle user with no referrer correctly", async function () {
            const referrerAddr = await booster.referrer(user1.address);
            expect(referrerAddr).to.equal(ethers.ZeroAddress);
        });

        it("Should handle referral count for new user", async function () {
            const count = await booster.referralCount(user1.address);
            expect(count).to.equal(0);
        });
    });
});
