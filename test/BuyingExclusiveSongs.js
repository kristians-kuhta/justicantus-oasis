const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { BigNumber } = ethers;
const {
  deployPlatform,
  registerSong,
  registerArtist,
  buyTokens
} = require('./utils');

describe('Buying exclusive songs', function() {
  it('reverts when trying to buy a song that does not exist', async function () {
    const { platform, firstAccount, secondAccount } = await loadFixture(deployPlatform);

    const fakeSongId = 1234;

    await expect(
      platform.connect(secondAccount).buySong(firstAccount.address, fakeSongId)
    ).to.be.revertedWithCustomError(platform, 'SongDoesNotExist');
  });

  it('reverts when trying to buy an non-exclusive song', async function () {
    const { platform, firstAccount, secondAccount } = await loadFixture(deployPlatform);

    await registerArtist(platform, firstAccount, 'John Doe');
    const songURI = 'QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB';

    // Register a non-exclusive song
    const songId = await registerSong(platform, firstAccount, songURI, 0);

    await expect(
      platform.connect(secondAccount).buySong(firstAccount.address, songId)
    ).to.be.revertedWithCustomError(platform, 'CannotBuyNonExclusiveSongs');
  });

  it('reverts when artist does not match the specified song ID', async function () {
    const { platform, firstAccount, secondAccount } = await loadFixture(deployPlatform);

    await registerArtist(platform, firstAccount, 'John Doe');
    const songURI = 'QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB';

    // Register a non-exclusive song
    const songId = await registerSong(platform, firstAccount, songURI, 123);

    await expect(
      platform.connect(secondAccount).buySong(secondAccount.address, songId)
    ).to.be.revertedWithCustomError(platform, 'ArtistDoesNotOwnSong');
  });

  it('reverts when has approved token balance, but less than price', async function () {
    const { platform, firstAccount, secondAccount, justToken } = await loadFixture(deployPlatform);

    await registerArtist(platform, firstAccount, 'John Doe');
    const songURI = 'QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB';

    // Register an exclusive song
    const decimals = await justToken.decimals();
    const fractionsPerToken = BigNumber.from(10).pow(decimals);

    const songPriceTokens = BigNumber.from(123);

    const songId = await registerSong(platform, firstAccount, songURI, songPriceTokens);
    const ownedAndApprovedWholeTokens = songPriceTokens.sub(1);
    const ownedAndApprovedTokens = ownedAndApprovedWholeTokens.mul(fractionsPerToken);

    await buyTokens(platform, justToken, secondAccount, ownedAndApprovedWholeTokens);
    await (
      await justToken.connect(secondAccount).approve(
        platform.address,
        ownedAndApprovedTokens
      )
    ).wait();

    await expect(
      platform.connect(secondAccount).buySong(firstAccount.address, songId)
    ).to.be.revertedWith('ERC20: insufficient allowance');
  });

  it('reverts when owns exactly the price amount in tokens, but not approved', async function () {
    const { platform, firstAccount, secondAccount, justToken } = await loadFixture(deployPlatform);

    await registerArtist(platform, firstAccount, 'John Doe');
    const songURI = 'QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB';

    // Register an exclusive song
    const decimals = await justToken.decimals();
    const fractionsPerToken = BigNumber.from(10).pow(decimals);

    const songPriceTokens = BigNumber.from(123);

    const songId = await registerSong(platform, firstAccount, songURI, songPriceTokens);

    await buyTokens(platform, justToken, secondAccount, songPriceTokens);

    await expect(
      platform.connect(secondAccount).buySong(firstAccount.address, songId)
    ).to.be.revertedWith('ERC20: insufficient allowance');
  });

  it('buys a song', async function () {
    const { platform, firstAccount, secondAccount, justToken } = await loadFixture(deployPlatform);

    await registerArtist(platform, firstAccount, 'John Doe');
    const songURI = 'QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB';

    // Register an exclusive song
    const decimals = await justToken.decimals();
    const fractionsPerToken = BigNumber.from(10).pow(decimals);

    const songPriceTokens = BigNumber.from(123);
    const ownedAndApprovedTokens = songPriceTokens.mul(fractionsPerToken);

    await (
      await justToken.connect(secondAccount).approve(
        platform.address,
        ownedAndApprovedTokens
      )
    ).wait();
    const songId = await registerSong(platform, firstAccount, songURI, songPriceTokens);

    await buyTokens(platform, justToken, secondAccount, songPriceTokens);

    const artistBalanceBefore = await justToken.balanceOf(firstAccount.address);

    await expect(
      platform.connect(secondAccount).buySong(firstAccount.address, songId)
    ).to.emit(platform, 'SongPurchased').withArgs(
      secondAccount.address,
      songId
    ).and.to.emit(justToken, 'Transfer').withArgs(
      secondAccount.address,
      firstAccount.address,
      ownedAndApprovedTokens
    );

    const artistBalanceAfter = await justToken.balanceOf(firstAccount.address);
    const artistBalanceChange = artistBalanceAfter.sub(artistBalanceBefore);

    expect(artistBalanceChange).to.eq(ownedAndApprovedTokens);

    expect(
      await platform.isSongPurchased(secondAccount.address, songId)
    ).to.eq(true);
  });
});
