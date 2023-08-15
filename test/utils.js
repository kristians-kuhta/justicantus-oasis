const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

const deployPlatform = async () => {
  const [owner, firstAccount, secondAccount] = await ethers.getSigners();

  const Platform = await ethers.getContractFactory("Platform");
  const platform = await Platform.deploy();

  return {
    platform,
    owner,
    firstAccount,
    secondAccount,
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

const registerSong = async (platform, artistAccount, uri) => {
  const RESOURCE_TYPE_SONG = 2;
  const registrationResponse = platform.connect(artistAccount).registerSong(uri);

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
}

module.exports = {
  deployPlatform,
  registerArtist,
  registerSong,
};
