const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { BigNumber } = ethers;
const {
  deployPlatform,
  registerSong,
  registerArtist,
  createSignature,
} = require('./utils');

async function registerSongAndVote(platform, artistAccount, voterAccount) {
  // register an artist
  await registerArtist(platform, artistAccount, 'First Artist');

  // register a song
  const ipfsID = 'QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB';

  const songId = await registerSong(platform, artistAccount, ipfsID, 0);

  const one = BigNumber.from(1);
  const hundred = BigNumber.from(100);

  const currentTimestamp = BigNumber.from(await time.latest());
  const timestamp = currentTimestamp.add(hundred);

  await time.setNextBlockTimestamp(currentTimestamp.add(one));

  await (await platform.openVotingPeriod(timestamp)).wait();
  await (await platform.connect(voterAccount).vote(songId)).wait();

  return { songId, timestamp, one };
}

describe('Song voting', function() {
  describe('Opening of voting period', function () {
    it('reverts when opening voting period with end timestamp that is not in future', async () => {
      const { platform } = await loadFixture(deployPlatform);

      const timestamp = await time.latest();

      // NOTE: next block timestamp will be timestamp + 1
      await expect(
        platform.openVotingPeriod(timestamp)
      ).to.be.revertedWithCustomError(platform, 'TimestampMustBeInFuture');
    });

    it('reverts when opening voting period and previous period is not closed', async () => {
      const { platform } = await loadFixture(deployPlatform);

      const one = BigNumber.from(1);
      const two = BigNumber.from(2);

      const currentTimestampOne = BigNumber.from(await time.latest());
      const timestampOne = currentTimestampOne.add(two);

      await time.setNextBlockTimestamp(currentTimestampOne.add(one));

      await (await platform.openVotingPeriod(timestampOne)).wait();

      const currentTimestampTwo = BigNumber.from(await time.latest());
      const timestampTwo = currentTimestampTwo.add(two);

      await time.setNextBlockTimestamp(currentTimestampTwo.add(one));

      await expect(
        platform.openVotingPeriod(timestampTwo)
      ).to.be.revertedWithCustomError(platform, 'VotingActive');
    });

    it('reverts when opening voting period by non-owner', async () => {
      const { platform, secondAccount } = await loadFixture(deployPlatform);

      const timestamp = await time.latest();

      // NOTE: timestamp does not matter here
      await expect(
        platform.connect(secondAccount).openVotingPeriod(timestamp)
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('opens a voting period', async () => {
      const { platform } = await loadFixture(deployPlatform);

      const one = BigNumber.from(1);
      const two = BigNumber.from(2);

      const currentTimestamp = BigNumber.from(await time.latest());
      const timestamp = currentTimestamp.add(two);

      await time.setNextBlockTimestamp(currentTimestamp.add(one));

      await expect(
        platform.openVotingPeriod(timestamp)
      ).to.emit(platform, 'VotingOpen');

      expect(await platform.isVotingPeriodActive()).to.eq(true);
    });

    it('cleans up previous votes when opening voting period after closing one', async () => {
      const { platform, firstAccount, secondAccount } = await loadFixture(deployPlatform);

      const one = BigNumber.from(1);
      const hundred = BigNumber.from(100);

      const currentTimestampOne = BigNumber.from(await time.latest());
      const timestampOne = currentTimestampOne.add(hundred);

      await time.setNextBlockTimestamp(currentTimestampOne.add(one));

      await (await platform.openVotingPeriod(timestampOne)).wait();

      // register an artist
      await registerArtist(platform, firstAccount, 'First Artist');

      // register a song
      const firstIpfsID = 'QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB';
      const secondIpfsID = 'Qm22222pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz422222';

      const firstSongId = await registerSong(platform, firstAccount, firstIpfsID, 0);
      const secondSongId = await registerSong(platform, firstAccount, secondIpfsID, 0);

      // vote for the song
      await (await platform.vote(firstSongId)).wait();
      await (await platform.connect(secondAccount).vote(firstSongId)).wait();

      // close voting period
      await time.setNextBlockTimestamp(timestampOne.add(one));
      await (await platform.closeVotingPeriod()).wait();

      const currentTimestampTwo = BigNumber.from(await time.latest());
      const timestampTwo = currentTimestampTwo.add(hundred);

      await time.setNextBlockTimestamp(currentTimestampTwo.add(one));

      await expect(
        platform.openVotingPeriod(timestampTwo)
      ).to.emit(platform, 'VotingOpen');

      // expect voting period opening to erase previous voting data
      expect(await platform.isVotingPeriodActive()).to.eq(true);

      await (await platform.vote(secondSongId)).wait();

      await time.setNextBlockTimestamp(timestampTwo.add(one));

      await expect(
        platform.closeVotingPeriod()
      ).to.emit(platform, 'VotingClosed').withArgs(secondSongId);
    });
  });

  describe('Voting', function () {
    it('reverts when voting for a song that does not exist', async () => {
      const { platform } = await loadFixture(deployPlatform);

      await expect(
        platform.vote(123)
      ).to.be.revertedWithCustomError(platform, 'SongDoesNotExist');
    });

    it('reverts when voting and voting period is not active', async () => {
      const { platform, firstAccount } = await loadFixture(deployPlatform);

      // register an artist
      await registerArtist(platform, firstAccount, 'First Artist');

      // register a song
      const ipfsID = 'QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB';

      const songId = await registerSong(platform, firstAccount, ipfsID, 0);

      await expect(
        platform.vote(songId)
      ).to.be.revertedWithCustomError(platform, 'VotingNotActive');
    });

    it('reverts when trying to vote for same song twice', async () => {
      const { platform, firstAccount } = await loadFixture(deployPlatform);

      // register an artist
      await registerArtist(platform, firstAccount, 'First Artist');

      // register a song
      const ipfsID = 'QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB';

      const songId = await registerSong(platform, firstAccount, ipfsID, 0);

      const one = BigNumber.from(1);
      const hundred = BigNumber.from(100);

      const currentTimestamp = BigNumber.from(await time.latest());
      const timestamp = currentTimestamp.add(hundred);

      await time.setNextBlockTimestamp(currentTimestamp.add(one));

      await (await platform.openVotingPeriod(timestamp)).wait();
      await (await platform.vote(songId)).wait();

      await expect(
        platform.vote(songId)
      ).to.be.revertedWithCustomError(platform, 'AlreadyVoted');
    });

    it('adds a vote for a song', async () => {
      const { platform, firstAccount, secondAccount } = await loadFixture(deployPlatform);

      const { songId, timestamp, one } = await registerSongAndVote(platform, firstAccount, secondAccount);

      // Since this will run on confidential EVM the only way of testing whether a
      // vote has been added is to close voting period and see if song won
      await time.setNextBlockTimestamp(timestamp.add(one));
      await expect(
        platform.closeVotingPeriod()
      ).to.emit(platform, 'VotingClosed').withArgs(songId);
    });
  });

  describe('Closing of voting period', function () {
    it('reverts when closing voting period with that has not ended yet', async () => {
      const { platform } = await loadFixture(deployPlatform);

      const one = BigNumber.from(1);
      const hundred = BigNumber.from(100);

      const currentTimestamp = BigNumber.from(await time.latest());
      const timestamp = currentTimestamp.add(hundred);

      await time.setNextBlockTimestamp(currentTimestamp.add(one));

      await (await platform.openVotingPeriod(timestamp)).wait();
      await expect(
        platform.closeVotingPeriod()
      ).to.be.revertedWithCustomError(platform, 'VotingHasNotEnded');
    });

    it('closes a voting period', async () => {
      const { platform } = await loadFixture(deployPlatform);

      const one = BigNumber.from(1);
      const hundred = BigNumber.from(100);

      const currentTimestamp = BigNumber.from(await time.latest());
      const timestamp = currentTimestamp.add(hundred);

      await time.setNextBlockTimestamp(currentTimestamp.add(one));

      await (await platform.openVotingPeriod(timestamp)).wait();

      await time.setNextBlockTimestamp(timestamp.add(one));

      await expect(
        platform.closeVotingPeriod()
      ).to.emit(platform, 'VotingClosed').withArgs(0);

      expect(await platform.isVotingPeriodActive()).to.eq(false);
    });

    it('distributes voting rewards to voters', async () => {
      const { platform, justToken, firstAccount, secondAccount } = await loadFixture(deployPlatform);

      // register an artist
      await registerArtist(platform, firstAccount, 'First Artist');

      // register a song
      const ipfsID = 'QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB';

      const songId = await registerSong(platform, firstAccount, ipfsID, 0);

      const one = BigNumber.from(1);
      const hundred = BigNumber.from(100);

      const currentTimestamp = BigNumber.from(await time.latest());
      const timestamp = currentTimestamp.add(hundred);

      await time.setNextBlockTimestamp(currentTimestamp.add(one));

      await (await platform.openVotingPeriod(timestamp)).wait();
      await (await platform.connect(firstAccount).vote(songId)).wait();
      await (await platform.connect(secondAccount).vote(songId)).wait();

      await time.setNextBlockTimestamp(timestamp.add(one));

      const firstAccountBalanceBefore = await justToken.balanceOf(firstAccount.address);
      const secondAccountBalanceBefore = await justToken.balanceOf(secondAccount.address);

      await expect(
        platform.closeVotingPeriod()
      ).to.emit(platform, 'VotingClosed').withArgs(songId);

      expect(await platform.isVotingPeriodActive()).to.eq(false);

      const firstAccountBalanceAfter = await justToken.balanceOf(firstAccount.address);
      const secondAccountBalanceAfter = await justToken.balanceOf(secondAccount.address);

      const firstAccountChange = firstAccountBalanceAfter.sub(firstAccountBalanceBefore);
      const secondAccountChange = secondAccountBalanceAfter.sub(secondAccountBalanceBefore);

      const rewardsPerProposal = await platform.rewardsPerProposal();

      expect(firstAccountChange).to.eq(rewardsPerProposal.div(2));
      expect(secondAccountChange).to.eq(rewardsPerProposal.div(2));
    });
  });

  describe('Current period voting status', function () {
    it('returns false when voting period is not active', async () => {
      const { platform, secondAccount } = await loadFixture(deployPlatform);

      const signature = await createSignature(secondAccount);

      expect(
        await platform.hasVotedCurrentPeriod(secondAccount.address, signature)
      ).to.eq(false);
    });

    it('returns false when signature is not valid', async () => {
      const { platform, firstAccount, secondAccount } = await loadFixture(deployPlatform);

      await registerSongAndVote(platform, firstAccount, secondAccount);

      const signature = await createSignature(firstAccount);

      expect(
        await platform.hasVotedCurrentPeriod(secondAccount.address, signature)
      ).to.eq(false);
    });

    it('returns false when account has not voted during current period', async () => {
      const { platform, firstAccount, secondAccount } = await loadFixture(deployPlatform);

      const signature = await createSignature(secondAccount);

      expect(
        await platform.hasVotedCurrentPeriod(secondAccount.address, signature)
      ).to.eq(false);
    });

    it('returns true when account has voted during current period', async () => {
      const { platform, firstAccount, secondAccount } = await loadFixture(deployPlatform);

      await registerSongAndVote(platform, firstAccount, secondAccount);

      const signature = await createSignature(secondAccount);

      expect(
        await platform.hasVotedCurrentPeriod(secondAccount.address, signature)
      ).to.eq(true);
    });
  });
});
