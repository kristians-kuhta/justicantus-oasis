// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import './JustToken.sol';

// TODO: consider a better naming for this contract
contract TokenRewards is Ownable {
  // TODO: make sure to follow best practices when it comes to contract member ordering
  JustToken public rewardsToken;
  uint256 public rewardsPerProposal;

  error RewardsCannotBeZero();

  event RewardsPerProposalUpdated(uint256 rewards);

  constructor(uint256 _rewardsPerProposal) {
    require(_rewardsPerProposal > 0, 'Rewards for proposal missing');

    rewardsToken = new JustToken();
    rewardsPerProposal = _rewardsPerProposal;
  }

  function setRewardsPerProposal(uint256 _rewards) external onlyOwner {
    _requireRewardsNotZero(_rewards);

    rewardsPerProposal = _rewards;

    emit RewardsPerProposalUpdated(_rewards);
  }

  function _requireRewardsNotZero(uint256 _rewards) internal pure {
    if (_rewards == 0) {
      revert RewardsCannotBeZero();
    }
  }
}
