// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { JustToken } from "./JustToken.sol";
import { SharedStorage } from "./SharedStorage.sol";

// TODO: consider a better naming for this contract
contract TokenRewards is Ownable, SharedStorage {
  uint256 public rewardsPerProposal;
  uint256 public pricePerToken;

  event RewardsPerProposalUpdated(uint256 rewards);
  event PricePerTokenUpdated(uint256 price);

  error RewardsCannotBeZero();
  error PriceCannotBeZero();
  error ValueCannotBeZero();
  error AmountCannotBeZero();
  error AmountMustMatchValueExactly();
  error InsufficientTokenBalance();

  constructor(uint256 _rewardsPerProposal, uint256 _pricePerToken) {
    require(_rewardsPerProposal > 0, "Rewards for proposal is zero");
    require(_pricePerToken > 0, "Price is zero");

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

  // Question: do we allow non-subscribers to purchase tokens? Currently, yes.
  function buyTokens(uint256 _wholeTokens) external payable {
    _requireAmountNotZero(_wholeTokens);
    _requireValueMatchesAmount(_wholeTokens);

    // TODO: maybe we should check the return value of this?
    uint256 platformTokenBalance = rewardsToken.balanceOf(address(this));
    uint256 fractionalTokens = _wholeTokens * (10**rewardsToken.decimals());

    // TODO: add test case when platform has existing tokens
    if (platformTokenBalance >= fractionalTokens) {
      rewardsToken.transfer(msg.sender, fractionalTokens);
    } else {
      rewardsToken.mint(msg.sender, fractionalTokens);
    }
  }

  function sellTokens(uint256 _wholeTokens, address _receiver) external {
    _requireAmountNotZero(_wholeTokens);

    uint256 fractionalTokens = _wholeTokens * (10**rewardsToken.decimals());

    // NOTE: owners must approve before we can do this
    rewardsToken.transferFrom(msg.sender, address(this), fractionalTokens);

    uint256 payout = _wholeTokens * pricePerToken;
    (bool success,) = payable(_receiver).call{ value: payout }("");
    require(success);
  }

  function _requireValueMatchesAmount(uint256 _wholeTokens) internal view {
    uint256 cost = _wholeTokens * pricePerToken;

    if (cost != msg.value) {
      revert AmountMustMatchValueExactly();
    }
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
}
