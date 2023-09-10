const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { deployPlatform, createSignature } = require('./utils');

describe('Audio encryption', function() {
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
  });

  describe('Accessing encryption key', function() {
    it('does not allow to access the encryption key variable directly', async function () {
      const { platform, secondAccount } = await loadFixture(deployPlatform);

      let variableFound;

      try {
        await platform.encryptionKey();
        variableFound = true;
      } catch (_e) {
        variableFound = false;
      }

      expect(variableFound).to.eq(false);
    });

    it('reverts when accessing encryption key from an account that is not encryptor', async function () {
      const { platform, secondAccount } = await loadFixture(deployPlatform);

      const signature = await createSignature(secondAccount);

      await expect(
        platform.getEncryptionKey(secondAccount.address, signature)
      ).to.be.revertedWithCustomError(platform, 'AccountNotEncryptor');
    });

    it('reverts when accessing encryption key from an encryptor account, with signature from other account',
      async function () {
      const { platform, firstAccount, secondAccount } = await loadFixture(deployPlatform);

      await (await platform.addEncryptor(secondAccount.address)).wait();

      const signature = await createSignature(firstAccount);

      await expect(
        platform.getEncryptionKey(secondAccount.address, signature)
      ).to.be.revertedWithCustomError(platform, 'InvalidSignature');
    });

    it('returns encryption key when requested by an encryptor account and with valid signature', async function () {
      const { platform, secondAccount, encryptionKey } = await loadFixture(deployPlatform);

      await (await platform.addEncryptor(secondAccount.address)).wait();

      const signature = await createSignature(secondAccount);

      expect(
        await platform.getEncryptionKey(secondAccount.address, signature)
      ).to.eq(encryptionKey);
    });
  });
});
