const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { BigNumber } = ethers;
const {
  deployPlatform,
  registerArtist,
  registerSong,
} = require('./utils');

describe("Claiming of rewards", function () {
  async function setUpArtistForClaimingRewards(platform, firstAccount, secondAccount) {
    await registerArtist(platform, firstAccount, 'First Artist');

    const ipfsID = 'QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB';
    const playedMinutes = 1000;

    await registerSong(platform, firstAccount, ipfsID, 0);

    await expect(
      platform.setRewardForPlayedMinute(2)
    ).to.emit(platform, 'RewardForPlayedMinutesChanged').withArgs(2);

    await (await platform.addReporter(secondAccount.address)).wait();
    await expect (
      platform.connect(secondAccount).updatePlayedMinutes([{
        artist: firstAccount.address,
        playedMinutes
      }])
    ).to.emit(platform, 'PlayedMinutesUpdated');
  }

  it('returns unclaimed ether amount', async function () {
    const { platform, firstAccount, secondAccount } = await loadFixture(deployPlatform);

    await setUpArtistForClaimingRewards(platform, firstAccount, secondAccount);

    expect(await platform.artistUnclaimedAmount(firstAccount.address)).to.eq(2000);
  });

  it('does not allow claiming for non-artists', async function () {
    const { platform, firstAccount, secondAccount } = await loadFixture(deployPlatform);

    await setUpArtistForClaimingRewards(platform, firstAccount, secondAccount);

    expect(await platform.artistUnclaimedAmount(firstAccount.address)).to.eq(2000);

    await expect(
      platform.connect(secondAccount).claimRewards()
    ).to.be.revertedWithCustomError(platform, 'NotARegisteredArtist');
  });

  it('does not allow claiming when no claimable minutes', async function () {
    const { platform, firstAccount, secondAccount } = await loadFixture(deployPlatform);

    await registerArtist(platform, firstAccount, 'First Artist');

    expect(await platform.artistUnclaimedAmount(firstAccount.address)).to.eq(0);

    await expect(
      platform.connect(firstAccount).claimRewards()
    ).to.be.revertedWithCustomError(platform, 'NoClaimableRewards');
  });

  it('claims unclaimed minutes and receives ether', async function () {
    const { platform, firstAccount, secondAccount } = await loadFixture(deployPlatform);

    await setUpArtistForClaimingRewards(platform, firstAccount, secondAccount);

    const subscriptionPrice = ethers.utils.parseEther('0.01');
    const subscriptionIncrease = 15*24*60*60; // 15 days

    await expect(
      platform.setSubscriptionPlan(subscriptionPrice, subscriptionIncrease)
    ).to.emit(platform, 'SubscriptionPlanAdded').withArgs(subscriptionPrice, subscriptionIncrease);

    const blockTimestamp = await time.latest();
    const newBlockTimestamp = blockTimestamp + 1;
    await time.setNextBlockTimestamp(newBlockTimestamp);

    await ( await platform.connect(secondAccount).createSubscription({ value: subscriptionPrice })).wait();

    expect(await platform.artistUnclaimedAmount(firstAccount.address)).to.eq(2000);

    const artistBalanceBefore = await platform.provider.getBalance(firstAccount.address);
    const platformBalanceBefore = await platform.provider.getBalance(platform.address);

    const claimTx = platform.connect(firstAccount).claimRewards();
    const claimReceipt = await (await claimTx).wait();

    await expect(claimTx).to.emit(platform, 'RewardsClaimed').withArgs(
      firstAccount.address,
      2000
    );

    const artistBalanceAfter = await platform.provider.getBalance(firstAccount.address);
    const platformBalanceAfter = await platform.provider.getBalance(platform.address);

    const gasFee = claimReceipt.gasUsed.mul(claimReceipt.effectiveGasPrice);

    expect(artistBalanceAfter.sub(artistBalanceBefore.sub(gasFee))).to.eq(2000);

    expect(platformBalanceBefore.sub(platformBalanceAfter)).to.eq(2000);
  });
});

