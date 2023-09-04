// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

import { JustToken } from "./JustToken.sol";

contract SharedStorage {
  JustToken public rewardsToken;

  uint256 public rewardForPlayedMinute;
  bytes32 internal encryptionKey;

  mapping(address account => uint256 id) public artistIds;

  mapping(uint256 id => string uri) internal songURIs;
  mapping(address account => uint256[] ids) internal songIds;
  mapping(address account => uint256 count) internal songsCount;

  mapping(address artist => uint256 playedMinutes) public artistPlayedMinutes;
  mapping(address artist => uint256 claimedMinutes) public artistClaimedMinutes;
  mapping(address account => mapping(uint256 songId => bool purchased)) internal boughtSongs;
  // NOTE: keep in mind these prices are in whole tokens not fractions (to keep things simple)
  mapping(uint256 id => uint256 price) public exclusiveSongPrices;

  mapping(address account => bool isReporter) internal reporters;
  mapping(address account => bool isEncryptor) internal encryptors;

  error NotARegisteredArtist();
  error AccountNotReporter();
  error AccountNotEncryptor();

  function isArtistSong(address artist, uint256 songId) external view returns (bool) {
    return _isArtistSong(artist, songId);
  }

  function _requireAccountIsReporter(address account) internal view {
    if (!reporters[account]) {
      revert AccountNotReporter();
    }
  }

  function _requireAccountIsEncryptor(address account) internal view {
    if (!encryptors[account]) {
      revert AccountNotEncryptor();
    }
  }

  function isArtistSong(address artist, uint256 songId) external view returns (bool) {
    return _isArtistSong(artist, songId);
  }

  // TODO: this for ResourceRegistration and ClaimingRewards contract
  function _requireRegisteredArtist() internal view {
    if (artistIds[msg.sender] == 0) {
      revert NotARegisteredArtist();
    }
  }

  function _isArtistSong(address artist, uint256 songId) internal view returns (bool) {
    uint256 artistSongsCount = songsCount[artist];
    for(uint256 i; i < artistSongsCount; i++) {
      if (songIds[artist][i] == songId) {
        return true;
      }
    }
    return false;
  }
}
