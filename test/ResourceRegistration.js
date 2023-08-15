const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

const { deployPlatform, registerArtist, registerSong } = require('./utils');

describe("ResourceRegistration", function () {
  describe('Artist registration', function () {
    it('reverts when registering an artist without name', async function () {
      const { platform } = await loadFixture(deployPlatform);

      await expect(
        platform.registerArtist('')
      ).to.be.revertedWithCustomError(platform, 'ArtistNameRequired');
    });

    it('reverts when trying to register artist twice from the same account', async function () {
      const { platform, firstAccount } = await loadFixture(deployPlatform);

      await registerArtist(platform, firstAccount, 'First Artist');
      await expect(
        platform.connect(firstAccount).registerArtist('Other Artist?')
      ).to.be.revertedWithCustomError(platform, 'ArtistAlreadyRegistered');
    });

    it('completes artist registration', async function () {
      const { platform, firstAccount } = await loadFixture(deployPlatform);

      await registerArtist(platform, firstAccount, 'First Artist');
    });
  });

  describe('Song registration', function () {
    it('initializes song registration', async function () {
      const { platform, firstAccount } = await loadFixture(deployPlatform);

      await registerArtist(platform, firstAccount, 'First Artist');

      const ipfsID = 'QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB';

      await registerSong(platform, firstAccount, ipfsID);
    });

    it('completes song registration', async function () {
      const { platform, firstAccount } = await loadFixture(deployPlatform);

      await registerArtist(platform, firstAccount, 'First Artist');

      const ipfsID = 'QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB';

      await registerSong(platform, firstAccount, ipfsID);
    });

    it('reverts when registering a song without providing uri', async function () {
      const { platform, firstAccount } = await loadFixture(deployPlatform);

      await registerArtist(platform, firstAccount, 'First Artist');

      await expect(
        platform.connect(firstAccount).registerSong('')
      ).to.be.revertedWithCustomError(platform, 'SongUriRequired');
    });

    it('reverts when registering song from an account that is not registered as an artist', async function () {
      const { platform } = await loadFixture(deployPlatform);

      await expect(
        platform.registerSong('something')
      ).to.be.revertedWithCustomError(platform, 'NotARegisteredArtist');
    });
  });
});
