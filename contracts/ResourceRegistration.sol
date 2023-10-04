// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

import { Sapphire } from "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";
import { SharedStorage } from "./SharedStorage.sol";

contract ResourceRegistration is SharedStorage {
  enum ResourceType {
    Unknown,
    Artist,
    Song
  }

  mapping(uint256 id => string name) public artistNames;

  // Data is either artist name or song uri
  event ResourceRegistered(
    address indexed account,
    ResourceType indexed resourceType,
    uint256 indexed id,
    string data
  );

  error ArtistNameRequired();
  error ArtistAlreadyRegistered();
  error SongUriRequired();

  function registerArtist(string calldata name) external {
    _requireArtistName(name);
    _requireNotRegistered();

    _registerArtist(msg.sender, name);
  }

  // NOTE: to register, non-exclusive (default) song pass a price of 0
  function registerSong(string calldata uri, uint256 exclusivePrice) external {
    _requireUri(uri);
    _requireRegisteredArtist();

    _registerSong(msg.sender, uri, exclusivePrice);
  }

  // ++++++++++++++++View/Pure functions +++++++++++++++
  function getArtistId(address account) external view returns (uint256) {
    return artistIds[account];
  }

  function getArtistName(address account) external view returns (string memory) {
    return artistNames[artistIds[account]];
  }

  function getSongUri(uint256 songId) external view returns (string memory) {
    return songURIs[songId];
  }

  function getArtistSongId(address artist, uint256 songIndex) external view returns (uint256) {
    return songIds[artist][songIndex];
  }

  function getArtistSongsCount(address artist) external view returns (uint256) {
    return songsCount[artist];
  }

 // +++++++++++++++++++++++++++++++++++++++++++++++++
  function _registerArtist(address account, string memory name) internal {
    uint256 generatedId = _generateRandomBytes();

    // NOTE: this might be needed, because the generator seems to be pseudo-random
    if (bytes(artistNames[generatedId]).length > 0) {
      generatedId = _generateRandomBytes();
    }

    artistNames[generatedId] = name;
    artistIds[account] = generatedId;
    artistCount++;
    artistAccounts.push(account);

    emit ResourceRegistered(
      account,
      ResourceType.Artist,
      generatedId,
      name
    );
  }

  function _registerSong(address artist, string memory uri, uint256 exclusivePrice) internal {
    uint256 generatedId = _generateRandomBytes();

    // NOTE: this might be needed, because the generator seems to be pseudo-random
    if (bytes(songURIs[generatedId]).length > 0) {
      generatedId = _generateRandomBytes();
    }

    songURIs[generatedId] = uri;
    songIds[artist].push(generatedId);
    songsCount[artist]++;
    exclusiveSongPrices[generatedId] = exclusivePrice;

    emit ResourceRegistered(
      artist,
      ResourceType.Song,
      generatedId,
      uri
    );
  }

  function _generateRandomBytes() internal view returns (uint256) {
    // NOTE: This is done because you cannot get Sapphire precompiles on local hardhat node
    if (block.chainid == 0x5aff || block.chainid == 0x5afe) {
        return uint256(
          bytes32(
            Sapphire.randomBytes(32, abi.encodePacked(block.timestamp))
          )
        );
    }

    return uint256(
      keccak256(
        abi.encodePacked(
          msg.sender,
          blockhash(block.number),
          block.timestamp,
          block.prevrandao,
          block.coinbase
        )
      )
    );
  }


  function _requireNotRegistered() internal view {
    if (artistIds[msg.sender] > 0) {
      revert ArtistAlreadyRegistered();
    }
  }

  function _requireArtistName(string calldata name) internal pure {
    if (bytes(name).length == 0) {
      revert ArtistNameRequired();
    }
  }

  function _requireUri(string calldata uri) internal pure {
    if (bytes(uri).length == 0) {
      revert SongUriRequired();
    }
  }

}
