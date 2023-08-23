// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { SharedStorage } from "./SharedStorage.sol";

contract ClaimingRewards is ReentrancyGuard, SharedStorage {
  event RewardsClaimed(address indexed artist, uint256 indexed rewards);

  error NoClaimableRewards();

  function claimRewards() external nonReentrant {
    _requireRegisteredArtist();
    _requireArtistHasUnclaimedRewards();

    uint256 playedMinutes = artistPlayedMinutes[msg.sender];
    uint256 claimedMinutes = artistClaimedMinutes[msg.sender];

    uint256 unclaimedAmount = _artistUnclaimedAmount(playedMinutes, claimedMinutes);

    artistClaimedMinutes[msg.sender] = playedMinutes + claimedMinutes;

    (bool success,) = payable(msg.sender).call{ value: unclaimedAmount }("");
    require(success);

    emit RewardsClaimed(msg.sender, unclaimedAmount);
  }

  function artistUnclaimedAmount(address artist) external view returns (uint256) {
    return _artistUnclaimedAmount(artistPlayedMinutes[artist], artistClaimedMinutes[artist]);
  }

  function _requireArtistHasUnclaimedRewards() internal view {
    uint256 playedMinutes = artistPlayedMinutes[msg.sender];
    uint256 claimedMinutes = artistClaimedMinutes[msg.sender];
    uint256 unclaimedMinutes = playedMinutes - claimedMinutes;

    if (unclaimedMinutes == 0) {
      revert NoClaimableRewards();
    }
  }

  function _artistUnclaimedAmount(uint256 playedMinutes, uint256 claimedMinutes) internal view returns(uint256) {
    return rewardForPlayedMinute * (playedMinutes - claimedMinutes);
  }
}
