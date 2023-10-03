// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

import { JustToken } from "./JustToken.sol";

contract SharedStorage {
  JustToken public rewardsToken;

  uint256 public rewardForPlayedMinute;
  bytes32 internal encryptionKey;
  uint256 public rewardsPerProposal;

  string private constant SIGNATURE_PREFIX = "\x19Ethereum Signed Message:\n32";

  mapping(address account => uint256 id) public artistIds;
  address[] public artistAccounts;
  uint256 public artistCount;

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
  error SongDoesNotExist();
  error InvalidSignature();

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

  function _requireSongExists(uint256 songId) internal view {
    if (bytes(songURIs[songId]).length == 0) {
      revert SongDoesNotExist();
    }
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

  function _requireSignatureValid(address account, bytes calldata signature) internal pure {
    // TODO: consider using the same approach for subscriber signatures
    bytes32 messageHash = keccak256(abi.encode(account));

    if (!_verifySignature(account, messageHash, signature)) {
      revert InvalidSignature();
    }
  }

  function _verifySignature(
    address signer,
    bytes32 messageHash,
    bytes calldata signature
  ) internal pure returns (bool) {

    (bytes32 r, bytes32 s, uint8 v) = _splitSignature(signature);

    bytes32 prefixedHash = keccak256(
      abi.encodePacked(SIGNATURE_PREFIX, messageHash)
    );
    address recoveredSigner = ecrecover(prefixedHash, v, r, s);

    // Check if the recovered public key matches the expected signer's address
    return recoveredSigner != address(0) && recoveredSigner == signer;
  }

  function _splitSignature(bytes calldata signature) internal pure
    returns (bytes32 r, bytes32 s, uint8 v) {
    r = bytes32(signature[0:32]);
    s = bytes32(signature[32:64]);
    v = uint8(bytes1(signature[64:65]));
  }
}
