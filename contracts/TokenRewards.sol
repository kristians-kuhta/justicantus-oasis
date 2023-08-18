// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import './JustToken.sol';

// TODO: consider a better naming for this contract
contract TokenRewards is Ownable {
  // TODO: make sure to follow best practices when it comes to contract member ordering
  JustToken public rewardsToken;
  uint256 public rewardsPerProposal;
  uint256 public pricePerToken;

  error RewardsCannotBeZero();
  error PriceCannotBeZero();
  error ValueCannotBeZero();
  error AmountCannotBeZero();
  error AmountMustMatchValueExactly();

  event RewardsPerProposalUpdated(uint256 rewards);
  event PricePerTokenUpdated(uint256 price);

  constructor(uint256 _rewardsPerProposal, uint256 _pricePerToken) {
    require(_rewardsPerProposal > 0, 'Rewards for proposal is zero');
    require(_pricePerToken > 0, 'Price is zero');

    rewardsToken = new JustToken();
    rewardsPerProposal = _rewardsPerProposal;
    pricePerToken = _pricePerToken;
  }

  function setRewardsPerProposal(uint256 _rewards) external onlyOwner {
    _requireRewardsNotZero(_rewards);

    rewardsPerProposal = _rewards;

    emit RewardsPerProposalUpdated(_rewards);
  }

  function setPricePerToken(uint256 _price) external onlyOwner {
    _requirePriceNotZero(_price);

    pricePerToken = _price;

    emit PricePerTokenUpdated(_price);
  }

  function _requireRewardsNotZero(uint256 _rewards) internal pure {
    if (_rewards == 0) {
      revert RewardsCannotBeZero();
    }
  }

  function _requirePriceNotZero(uint256 _price) internal pure {
    if (_price == 0) {
      revert PriceCannotBeZero();
    }
  }

  function _requireAmountNotZero(uint256 _amount) internal pure {
    if (_amount == 0) {
      revert AmountCannotBeZero();
    }
  }

  function _requireValue() internal view {
    if (msg.value == 0) {
      revert ValueCannotBeZero();
    }
  }

  function _requireValueMatchesAmount(uint256 _amount) internal view {
    if (_amount * pricePerToken != msg.value) {
      revert AmountMustMatchValueExactly();
    }
  }

  // Question: do we allow non-subscribers to purchase tokens? Currently, yes.
  function buyTokens(uint256 _amount) external payable {
    _requireAmountNotZero(_amount);
    _requireValue();
    _requireValueMatchesAmount(_amount);

    //TODO: maybe we should check the return value of this?
    rewardsToken.mint(msg.sender, _amount);
    // NOTE: no extra events are emitted, OZ ERC20 already emits an Transfer event
  }
}
