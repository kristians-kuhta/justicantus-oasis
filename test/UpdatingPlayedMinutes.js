const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { BigNumber } = ethers;
const {
  deployPlatform,
  registerArtist,
  registerSong,
} = require('./utils');

describe('Updating played minutes', function() {
  it('does not allow updating played minutes by non-reporter', async function() {
    const { platform, firstAccount } = await loadFixture(deployPlatform);

    const artistUpdate = {
      artist: firstAccount.address,
      playedMinutes: 123
    };

    await expect(
      platform.updatePlayedMinutes([artistUpdate])
    ).to.be.revertedWithCustomError(platform, 'AccountNotReporter');
  });

  it('does not allow updating played minutes when no updates are provided', async function() {
    const { platform } = await loadFixture(deployPlatform);

    await expect(
      platform.updatePlayedMinutes([])
    ).to.be.revertedWithCustomError(platform, 'AccountNotReporter');
  });

  it('does not allow updating played minutes when one of the addresses is not an artist', async function() {
    const { platform, firstAccount, secondAccount } = await loadFixture(deployPlatform);

    await registerArtist(platform, firstAccount, 'Doesnotmatter');

    await (await platform.addReporter(secondAccount.address)).wait();

    const artistUpdates = [
      {
        artist: firstAccount.address,
        playedMinutes: 123
      },
      {
        artist: ethers.constants.AddressZero,
        playedMinutes: 212
      }
    ];

    await expect(
      platform.connect(secondAccount).updatePlayedMinutes(artistUpdates)
    ).to.be.revertedWithCustomError(platform, 'UpdateInvalid').withArgs(
      ethers.constants.AddressZero,
      212
    );
  });

  it('does not allow to update artist played minutes to less than they where before', async function() {
    const { platform, firstAccount, secondAccount } = await loadFixture(deployPlatform);

    await registerArtist(platform, firstAccount, 'Doesnotmatter');

    await (await platform.addReporter(secondAccount.address)).wait();

    const artistUpdates1 = [
      {
        artist: firstAccount.address,
        playedMinutes: 123
      },
    ];

    const artistUpdates2 = [
      {
        artist: firstAccount.address,
        playedMinutes: 122
      },
    ];

    await (await platform.connect(secondAccount).updatePlayedMinutes(artistUpdates1)).wait();

    await expect(
      platform.connect(secondAccount).updatePlayedMinutes(artistUpdates2)
    ).to.be.revertedWithCustomError(platform, 'UpdateInvalid').withArgs(
      firstAccount.address,
      122
    );
  });

  it('stores the initial played minutes', async function() {
    const { platform, firstAccount, secondAccount } = await loadFixture(deployPlatform);

    await registerArtist(platform, firstAccount, 'Doesnotmatter');

    await (await platform.addReporter(secondAccount.address)).wait();

    expect(await platform.artistPlayedMinutes(firstAccount.address)).to.eq(BigNumber.from(0));

    const artistUpdates = [
      {
        artist: firstAccount.address,
        playedMinutes: 123
      }
    ];

    await expect(
      platform.connect(secondAccount).updatePlayedMinutes(artistUpdates)
    ).to.emit(platform, 'PlayedMinutesUpdated');

    expect(await platform.artistPlayedMinutes(firstAccount.address)).to.eq(BigNumber.from(123));
  });

  it('stores the second update of played minutes', async function() {
    const { platform, firstAccount, secondAccount } = await loadFixture(deployPlatform);

    await registerArtist(platform, firstAccount, 'Doesnotmatter');

    await (await platform.addReporter(secondAccount.address)).wait();

    expect(await platform.artistPlayedMinutes(firstAccount.address)).to.eq(BigNumber.from(0));

    const artistUpdates1 = [
      {
        artist: firstAccount.address,
        playedMinutes: 123
      }
    ];

    await expect(
      platform.connect(secondAccount).updatePlayedMinutes(artistUpdates1)
    ).to.emit(platform, 'PlayedMinutesUpdated');

    expect(await platform.artistPlayedMinutes(firstAccount.address)).to.eq(BigNumber.from(123));

    const artistUpdates2 = [
      {
        artist: firstAccount.address,
        playedMinutes: 124
      }
    ];

    await expect(
      platform.connect(secondAccount).updatePlayedMinutes(artistUpdates2)
    ).to.emit(platform, 'PlayedMinutesUpdated');

    expect(await platform.artistPlayedMinutes(firstAccount.address)).to.eq(BigNumber.from(124));
  });
});
