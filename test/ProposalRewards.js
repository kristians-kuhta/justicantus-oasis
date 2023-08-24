const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { deployPlatform } = require('./utils');

describe('Proposal rewards', function() {
  it('returns the address of the rewards token', async function () {
    const { platform, justToken } = await loadFixture(deployPlatform);

    expect(await platform.rewardsToken()).to.eq(justToken.address);
  });

  it('returns rewards per proposal', async function () {
    const { platform, defaultRewards } = await loadFixture(deployPlatform);

    expect(await platform.rewardsPerProposal()).to.eq(defaultRewards);
  });

  it('reverts when non-owner trying to set rewards for proposal', async function () {
    const { platform, secondAccount } = await loadFixture(deployPlatform);

    const rewards = ethers.utils.parseEther('100');

    await expect(
      platform.connect(secondAccount).setRewardsPerProposal(rewards)
    ).to.be.revertedWith('Ownable: caller is not the owner');
  });

  it('reverts when setting proposal rewards to zero', async function () {
    const { platform, secondAccount } = await loadFixture(deployPlatform);

    await expect(
      platform.setRewardsPerProposal('0')
    ).to.be.revertedWithCustomError(platform, 'RewardsCannotBeZero');
  });

  it('sets rewards per proposal', async function () {
    const { platform } = await loadFixture(deployPlatform);
    const rewards = ethers.utils.parseEther('123');

    await expect(platform.setRewardsPerProposal(rewards)).to.emit(
      platform,
      'RewardsPerProposalUpdated'
    ).withArgs(rewards);

    expect(await platform.rewardsPerProposal()).to.eq(rewards);
  });
});
