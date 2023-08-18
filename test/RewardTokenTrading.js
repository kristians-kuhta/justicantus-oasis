const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { deployPlatform } = require('./utils');

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
      ).to.be.revertedWithCustomError(platform, 'ValueCannotBeZero');
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
      const { platform, secondAccount, justToken } = await loadFixture(deployPlatform);

      const oneTokenPrice = await platform.pricePerToken();
      const tokensCount = 2;
      const tokensCost = tokensCount * oneTokenPrice;

      await expect(
        platform.connect(secondAccount).buyTokens(tokensCount, { value: tokensCost })
      ).to.emit(justToken, 'Transfer').withArgs(
        ethers.constants.AddressZero,
        secondAccount.address,
        tokensCount
      );
    });
  });

  it('reverts when trying to sell more tokens than owned', async function () {
  });

  it('reverts when trying to sell zero tokens', async function () {
  });

  it('sells specified amount of tokens', async function () {
  });
});
