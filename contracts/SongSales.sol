// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

import { SharedStorage } from "./SharedStorage.sol";

contract SongSales is SharedStorage {
  event SongPurchased(address indexed account, uint256 indexed songId);

  error SongDoesNotExist();
  error CannotBuyNonExclusiveSongs();
  error ArtistDoesNotOwnSong();

  function buySong(address artist, uint256 songId) external payable {
    _requireSongExists(songId);
    _requireExclusiveSong(songId);
    _requireArtistOwnsSong(artist, songId);

    uint256 priceWhole = exclusiveSongPrices[songId];
    uint256 decimals = rewardsToken.decimals();
    uint256 fractionsPerToken = 10**decimals;
    uint256 priceFractional = priceWhole * fractionsPerToken;

    rewardsToken.transferFrom(msg.sender, artist, priceFractional);

    boughtSongs[msg.sender][songId] = true;

    emit SongPurchased(msg.sender, songId);
  }

  function isSongPurchased(address account, uint256 songId) external view returns (bool) {
    return boughtSongs[account][songId];
  }

  function _requireSongExists(uint256 songId) internal view {
    if (bytes(songURIs[songId]).length == 0) {
      revert SongDoesNotExist();
    }
  }

  function _requireExclusiveSong(uint256 songId) internal view {
    if (exclusiveSongPrices[songId] == 0) {
      revert CannotBuyNonExclusiveSongs();
    }
  }

  function _requireArtistOwnsSong(address artist, uint256 songId) internal view {
    if (!_isArtistSong(artist, songId)) {
      revert ArtistDoesNotOwnSong();
    }
  }
}
