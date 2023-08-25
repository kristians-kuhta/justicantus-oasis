const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const {
  deployPlatform,
  registerSong,
  registerArtist,
} = require('./utils');

describe.only('Audio encryption', function() {
  describe('Encryptor account', function () {
    it('does not allow adding encryptor account by non-owner', async function() {
      const { platform, firstAccount, secondAccount } = await loadFixture(deployPlatform);
      await expect(
        platform.connect(secondAccount).addEncryptor(firstAccount.address)
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('does not allow adding encryptor account if already added', async function() {
      const { platform, secondAccount } = await loadFixture(deployPlatform);
      await ( await platform.addEncryptor(secondAccount.address)).wait();

      await expect(
        platform.addEncryptor(secondAccount.address)
      ).to.be.revertedWithCustomError(platform, 'AccountIsEncryptor');
    });

    it('adds an encryptor account when called by owner', async function() {
      const { platform, secondAccount } = await loadFixture(deployPlatform);

      await expect(
        platform.addEncryptor(secondAccount.address)
      ).to.emit(platform, 'EncryptorAdded').withArgs(
        secondAccount.address
      );
    });

    it('does not allow removing encryptor accounts by non-owner', async function() {
      const { platform, firstAccount, secondAccount } = await loadFixture(deployPlatform);
      await expect(
        platform.connect(secondAccount).removeEncryptor(firstAccount.address)
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('does not allow removing an account that is not an encryptor', async function() {
      const { platform, secondAccount } = await loadFixture(deployPlatform);

      await expect(
        platform.removeEncryptor(secondAccount.address)
      ).to.be.revertedWithCustomError(platform, 'AccountNotEncryptor');
    });

    it('removes an encryptor account when called by owner', async function() {
      const { platform, secondAccount } = await loadFixture(deployPlatform);

      await expect(
        platform.addEncryptor(secondAccount.address)
      ).to.emit(platform, 'EncryptorAdded').withArgs(secondAccount.address);

      await expect(
        platform.removeEncryptor(secondAccount.address)
      ).to.emit(platform, 'EncryptorRemoved').withArgs(secondAccount.address);
    });
  })
});
