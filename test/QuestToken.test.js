const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("QuestToken", function () {
    let QuestToken;
    let token;
    let owner;
    let minter;
    let user1;
    let user2;

    const TOKEN_NAME = "Quest Token";
    const TOKEN_SYMBOL = "QUEST";
    const MAX_SUPPLY = ethers.parseEther("1000000000"); // 1 billion

    beforeEach(async function () {
        [owner, minter, user1, user2] = await ethers.getSigners();
        
        QuestToken = await ethers.getContractFactory("QuestToken");
        token = await QuestToken.deploy(TOKEN_NAME, TOKEN_SYMBOL, 1000000000);
        await token.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the correct name and symbol", async function () {
            expect(await token.name()).to.equal(TOKEN_NAME);
            expect(await token.symbol()).to.equal(TOKEN_SYMBOL);
        });

        it("Should set the correct max supply", async function () {
            expect(await token.maxSupply()).to.equal(MAX_SUPPLY);
        });

        it("Should set the deployer as owner", async function () {
            expect(await token.owner()).to.equal(owner.address);
        });

        it("Should have 18 decimals", async function () {
            expect(await token.decimals()).to.equal(18);
        });

        it("Should have zero initial supply", async function () {
            expect(await token.totalSupply()).to.equal(0);
        });
    });

    describe("Minting", function () {
        beforeEach(async function () {
            await token.addMinter(minter.address);
        });

        it("Should allow minter to mint tokens", async function () {
            const amount = ethers.parseEther("1000");
            await token.connect(minter).mint(user1.address, amount);
            expect(await token.balanceOf(user1.address)).to.equal(amount);
        });

        it("Should update total supply after minting", async function () {
            const amount = ethers.parseEther("1000");
            await token.connect(minter).mint(user1.address, amount);
            expect(await token.totalSupply()).to.equal(amount);
        });

        it("Should revert if non-minter tries to mint", async function () {
            const amount = ethers.parseEther("1000");
            await expect(
                token.connect(user1).mint(user2.address, amount)
            ).to.be.reverted;
        });

        it("Should revert if minting exceeds max supply", async function () {
            const exceedAmount = MAX_SUPPLY + ethers.parseEther("1");
            await expect(
                token.connect(minter).mint(user1.address, exceedAmount)
            ).to.be.reverted;
        });
    });

    describe("Minter Management", function () {
        it("Should allow owner to add minter", async function () {
            await token.addMinter(minter.address);
            expect(await token.isMinter(minter.address)).to.be.true;
        });

        it("Should allow owner to remove minter", async function () {
            await token.addMinter(minter.address);
            await token.removeMinter(minter.address);
            expect(await token.isMinter(minter.address)).to.be.false;
        });

        it("Should revert if non-owner tries to add minter", async function () {
            await expect(
                token.connect(user1).addMinter(minter.address)
            ).to.be.reverted;
        });
    });

    describe("Transfers", function () {
        beforeEach(async function () {
            await token.addMinter(minter.address);
            await token.connect(minter).mint(user1.address, ethers.parseEther("1000"));
        });

        it("Should transfer tokens between accounts", async function () {
            const amount = ethers.parseEther("100");
            await token.connect(user1).transfer(user2.address, amount);
            expect(await token.balanceOf(user2.address)).to.equal(amount);
        });

        it("Should emit Transfer event", async function () {
            const amount = ethers.parseEther("100");
            await expect(token.connect(user1).transfer(user2.address, amount))
                .to.emit(token, "Transfer")
                .withArgs(user1.address, user2.address, amount);
        });

        it("Should revert if sender has insufficient balance", async function () {
            const amount = ethers.parseEther("2000");
            await expect(
                token.connect(user1).transfer(user2.address, amount)
            ).to.be.reverted;
        });
    });

    describe("Approvals", function () {
        beforeEach(async function () {
            await token.addMinter(minter.address);
            await token.connect(minter).mint(user1.address, ethers.parseEther("1000"));
        });

        it("Should approve spender", async function () {
            const amount = ethers.parseEther("500");
            await token.connect(user1).approve(user2.address, amount);
            expect(await token.allowance(user1.address, user2.address)).to.equal(amount);
        });

        it("Should allow transferFrom after approval", async function () {
            const amount = ethers.parseEther("500");
            await token.connect(user1).approve(user2.address, amount);
            await token.connect(user2).transferFrom(user1.address, user2.address, amount);
            expect(await token.balanceOf(user2.address)).to.equal(amount);
        });
    });
});
