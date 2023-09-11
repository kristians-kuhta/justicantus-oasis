// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import { ResourceRegistration } from "./ResourceRegistration.sol";
import { Subscription } from "./Subscription.sol";
import { Reporter } from "./Reporter.sol";
import { Encryptor } from "./Encryptor.sol";
import { EncryptionKey } from "./EncryptionKey.sol";
import { PlayedMinutesReward } from "./PlayedMinutesReward.sol";
import { TokenRewards } from "./TokenRewards.sol";
import { ClaimingRewards } from "./ClaimingRewards.sol";
import { UpdatePlayedMinutes } from "./UpdatePlayedMinutes.sol";
import { SongSales } from "./SongSales.sol";
import { SongVoting } from "./SongVoting.sol";

contract Platform is
  Ownable,
  ResourceRegistration,
  Subscription,
  Reporter,
  Encryptor,
  PlayedMinutesReward,
  TokenRewards,
  ClaimingRewards,
  UpdatePlayedMinutes,
  SongSales,
  EncryptionKey,
  SongVoting
  {
  constructor(uint256 _rewardsForProposal, uint256 _pricePerToken, bytes32 _encryptionKey)
    PlayedMinutesReward()
    TokenRewards(_rewardsForProposal, _pricePerToken)
    EncryptionKey(_encryptionKey) {}
}
