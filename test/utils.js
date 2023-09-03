const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { BigNumber } = ethers;
const _sodium = require('libsodium-wrappers');

const deployPlatform = async () => {
  const [owner, firstAccount, secondAccount] = await ethers.getSigners();

  const Platform = await ethers.getContractFactory("Platform");
  const defaultRewards = ethers.utils.parseEther('100');
  const defaultPricePerToken = ethers.utils.parseEther('0.0001');

  await _sodium.ready;
  const sodium = _sodium;
  const generatedKey = await sodium.crypto_secretstream_xchacha20poly1305_keygen();
  const encryptionKey = '0x' + Buffer.from(generatedKey).toString('hex');

  const platform = await Platform.deploy(defaultRewards, defaultPricePerToken, encryptionKey);
  const justTokenAddress = await platform.rewardsToken();
  const JustToken = await ethers.getContractFactory('JustToken');
  const justToken = await JustToken.attach(justTokenAddress);

  return {
    platform,
    owner,
    firstAccount,
    secondAccount,
    defaultRewards,
    defaultPricePerToken,
    justToken,
    encryptionKey
  };
}

const registerArtist = async (platform, artistAccount, artistName) => {
  const RESOURCE_TYPE_ARTIST = 1;

  expect(
    await platform.connect(artistAccount).registerArtist(artistName)
  ).to.emit(platform, 'ResourceRegistered').withArgs(
    artistAccount.address,

    RESOURCE_TYPE_ARTIST,
    anyValue,
    artistName
  );

  expect(
    await platform.getArtistName(artistAccount.address)
  ).to.equal(artistName);

  // Expecting that the ID has been assigned
  expect(
    (await platform.getArtistId(artistAccount.address)).toString()
  ).not.to.equal('0');
}

const registerSong = async (platform, artistAccount, uri, exclusivePrice) => {
  const RESOURCE_TYPE_SONG = 2;
  const registrationResponse = platform.connect(artistAccount).registerSong(uri, exclusivePrice);

  await expect(registrationResponse).to.emit(platform, 'ResourceRegistered').withArgs(
    artistAccount.address,
    RESOURCE_TYPE_SONG,
    anyValue,
    uri
  );

  const songCount = await platform.getArtistSongsCount(artistAccount.address);
  const lastSongIdx = songCount > 0 ? songCount - 1 : 0;
  const returnedSongId = await platform.getArtistSongId(artistAccount.address, lastSongIdx);

  expect(
    await platform.isArtistSong(artistAccount.address, returnedSongId)
  ).to.eq(true);

  expect(returnedSongId.toString()).not.to.eq('0');
  expect(await platform.getSongUri(returnedSongId)).to.eq(uri);

  expect(await platform.exclusiveSongPrices(returnedSongId)).to.eq(exclusivePrice);

  return returnedSongId;
}

const buyTokens = async (platform, justToken, account, tokensCount) => {
  const oneTokenPrice = await platform.pricePerToken();
  const tokensCost = BigNumber.from(tokensCount).mul(oneTokenPrice);

  const decimals = await justToken.decimals();
  const fractionsPerToken = BigNumber.from(10).pow(decimals);

  const expectedTokensCount = BigNumber.from(tokensCount).mul(fractionsPerToken);
  await expect(
    platform.connect(account).buyTokens(tokensCount, { value: tokensCost })
  ).to.emit(justToken, 'Transfer').withArgs(
    ethers.constants.AddressZero,
    account.address,
    expectedTokensCount
  );
};

const createSignature = async (account) => {
  const message = account.address.toLowerCase();
  const encodedAccount = ethers.utils.defaultAbiCoder.encode(['address'], [message]);
  const messageHash = ethers.utils.keccak256(encodedAccount);
  const signedData = ethers.utils.arrayify(messageHash);

  return await account.signMessage(signedData);
};

module.exports = {
  deployPlatform,
  registerArtist,
  registerSong,
  buyTokens,
  createSignature,
};
