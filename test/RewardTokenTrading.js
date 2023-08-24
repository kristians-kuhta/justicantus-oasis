const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { deployPlatform } = require('./utils');
const { BigNumber } = ethers;

async function buyTokens(platform, justToken, account, tokensCount) {
  const oneTokenPrice = await platform.pricePerToken();
  const tokensCost = tokensCount * oneTokenPrice;

  await expect(
    platform.connect(account).buyTokens(tokensCount, { value: tokensCost })
  ).to.emit(justToken, 'Transfer').withArgs(
    ethers.constants.AddressZero,
    account.address,
    tokensCount
  );
};

describe('Reward token trading', function() {
  describe('Token pricing', function() {
    it('reverts when trying to set price for token by non-owner', async function () {
      const { platform, secondAccount } = await loadFixture(deployPlatform);

      await expect(
        platform.connect(secondAccount).setPricePerToken(123)
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('reverts when trying to set price for token to zero', async function () {
      const { platform } = await loadFixture(deployPlatform);

      await expect(
        platform.setPricePerToken(0)
      ).to.be.revertedWithCustomError(platform, 'PriceCannotBeZero');
    });

    it('sets the price per token', async function () {
      const { platform, secondAccount } = await loadFixture(deployPlatform);
      const price = ethers.utils.parseEther('0.0001');

      await expect(
        platform.setPricePerToken(price)
      ).to.emit(platform, 'PricePerTokenUpdated').withArgs(price);

      expect(await platform.pricePerToken()).to.eq(price);
    });
  });

  describe('Buying tokens', function () {
    it('reverts when trying to buy tokens without providing value', async function () {
      const { platform } = await loadFixture(deployPlatform);

      await expect(
        platform.buyTokens(123)
      ).to.be.revertedWithCustomError(platform, 'AmountMustMatchValueExactly');
    });

    it('reverts when trying to buy more tokens than provided value', async function () {
      const { platform } = await loadFixture(deployPlatform);
      const oneTokenPrice = await platform.pricePerToken();

      await expect(
        platform.buyTokens(2, { value: oneTokenPrice })
      ).to.be.revertedWithCustomError(platform, 'AmountMustMatchValueExactly');
    });

    it('reverts when trying to buy zero tokens', async function () {
      const { platform } = await loadFixture(deployPlatform);
      const oneTokenPrice = await platform.pricePerToken();

      await expect(
        platform.buyTokens(0, { value: oneTokenPrice })
      ).to.be.revertedWithCustomError(platform, 'AmountCannotBeZero');
    });

    it('allows buying of tokens', async function () {
      const { platform, justToken, secondAccount } = await loadFixture(deployPlatform);

      await buyTokens(platform, justToken, secondAccount, 2);
    });
  });

  describe('Selling tokens', function () {
    it('reverts when trying to sell zero tokens', async function () {
      const { platform, justToken, secondAccount } = await loadFixture(deployPlatform);

      await expect(
        platform.connect(secondAccount).sellTokens(0, secondAccount.address)
      ).to.be.revertedWithCustomError(platform, 'AmountCannotBeZero');
    });

    it('reverts when trying to sell more tokens than owned', async function () {
      const { platform, justToken, secondAccount } = await loadFixture(deployPlatform);

      const ownedTokens = 2;

      await buyTokens(platform, justToken, secondAccount, ownedTokens);

      await ( await justToken.connect(secondAccount).approve(platform.address, ownedTokens + 1)).wait();

      await expect(
        platform.connect(secondAccount).sellTokens(
          ownedTokens + 1, secondAccount.address
        )
      ).to.be.revertedWith('ERC20: transfer amount exceeds balance');
    });

    it('reverts when selling tokens without approving them first', async function () {
      const { platform, justToken, secondAccount } = await loadFixture(deployPlatform);

      const ownedTokens = 2;

      await buyTokens(platform, justToken, secondAccount, ownedTokens);

      await expect(
        platform.connect(secondAccount).sellTokens(
          ownedTokens,
          secondAccount.address
        )
      ).to.be.revertedWith('ERC20: insufficient allowance');
    });

    it('sells specified amount of tokens', async function () {
      const { platform, justToken, secondAccount } = await loadFixture(deployPlatform);

      const ownedTokens = BigNumber.from(3);
      const soldTokens = ownedTokens.sub(1);

      await buyTokens(platform, justToken, secondAccount, ownedTokens);

      expect(await justToken.balanceOf(secondAccount.address)).to.eq(ownedTokens);
      expect(await justToken.balanceOf(platform.address)).to.eq(0);

      await ( await justToken.connect(secondAccount).approve(platform.address, soldTokens)).wait();

      const accountEthBalanceBefore = await ethers.provider.getBalance(secondAccount.address);
      const platformEthBalanceBefore = await ethers.provider.getBalance(platform.address);

      const tx = platform.connect(secondAccount).sellTokens(soldTokens, secondAccount.address)
      await expect(tx).to.emit(justToken, 'Transfer').withArgs(
        secondAccount.address,
        platform.address,
        soldTokens
      );

      const txReceipt = await (await tx).wait();
      const txCost = txReceipt.gasUsed.mul(txReceipt.effectiveGasPrice);

      expect(await justToken.balanceOf(secondAccount.address)).to.eq(
        ownedTokens.sub(soldTokens)
      );
      expect(await justToken.balanceOf(platform.address)).to.eq(soldTokens);

      const accountEthBalanceAfter = await ethers.provider.getBalance(secondAccount.address);
      const platformEthBalanceAfter = await ethers.provider.getBalance(platform.address);

      const pricePerToken = await platform.pricePerToken();
      const payout = pricePerToken.mul(soldTokens);

      const expectedAccountBalance = accountEthBalanceBefore.add(payout).sub(txCost);
      expect(accountEthBalanceAfter).to.eq(expectedAccountBalance);

      const expectedPlatformBalance = platformEthBalanceBefore.sub(payout);
      expect(platformEthBalanceAfter).to.eq(expectedPlatformBalance);
    });
  });
});
