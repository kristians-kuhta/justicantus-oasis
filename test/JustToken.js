const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { deployPlatform } = require('./utils');

// TODO: right now only testing our custom logic (minting), consider adding tests for default ERC20
//       behaviour
describe('JUST token', function() {
  it('reverts when trying to mint a token by non-owner', async function () {
    const { justToken, secondAccount } = await loadFixture(deployPlatform);

    await expect(
      justToken.connect(secondAccount).mint(secondAccount.address, 123)
    ).to.be.revertedWith('Ownable: caller is not the owner');
  });

  it('mints tokens for an address', async function () {
    const { justToken, platform, secondAccount } = await loadFixture(deployPlatform);
    const accountAddress = secondAccount.address;

    expect(await justToken.balanceOf(accountAddress)).to.eq(0);

    const tokenCount = 123;

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [platform.address],
    });

    await network.provider.send("hardhat_setBalance", [
      platform.address,
      "0x200000000000000"
    ]);

    const signer = await ethers.getSigner(platform.address);

    await expect(
      justToken.connect(signer).mint(accountAddress, tokenCount)
    ).to.emit(justToken, 'Transfer').withArgs(
      ethers.constants.AddressZero,
      accountAddress,
      tokenCount
    );

    expect(await justToken.balanceOf(accountAddress)).to.eq(tokenCount);

    await hre.network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [platform.address],
    });
  });
});
