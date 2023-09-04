// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

import { SharedStorage } from "./SharedStorage.sol";

contract UpdatePlayedMinutes is SharedStorage {
  struct ArtistUpdate {
    address artist;
    uint256 playedMinutes;
  }

  event PlayedMinutesUpdated();

  error NoUpdatesGiven();
  error UpdateInvalid(address artist, uint256 playedMinutes);

  function updatePlayedMinutes(ArtistUpdate[] calldata updates) external {
    _requireAccountIsReporter(msg.sender);
    _requireValidUpdates(updates);

    for(uint256 i; i < updates.length; i++) {
      ArtistUpdate memory update = updates[i];
      artistPlayedMinutes[update.artist] = update.playedMinutes;
    }

    emit PlayedMinutesUpdated();
  }

  function _requireValidUpdates(ArtistUpdate[] calldata updates) internal view {
    if (updates.length == 0) {
      revert NoUpdatesGiven();
    }

    for(uint256 i; i < updates.length; i++) {
      ArtistUpdate memory update = updates[i];

      if (artistIds[update.artist] == 0) {
        revert UpdateInvalid(update.artist, update.playedMinutes);
      }

      uint256 previousPlayedMinutes = artistPlayedMinutes[update.artist];

      if (previousPlayedMinutes >= update.playedMinutes) {
        revert UpdateInvalid(update.artist, update.playedMinutes);
      }
    }
  }
}
