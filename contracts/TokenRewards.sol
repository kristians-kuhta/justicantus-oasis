// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { JustToken } from "./JustToken.sol";

// TODO: consider a better naming for this contract
contract TokenRewards is Ownable {
  JustToken public rewardsToken;
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

  function buyTokens(uint256 _amount) external payable {
    _requireAmountNotZero(_amount);
    _requireValueMatchesAmount(_amount);

    // TODO: maybe we should check the return value of this?
    // TODO: check if enough balance, else mint only the missing tokens
    rewardsToken.mint(msg.sender, _amount);
    // NOTE: no extra events are emitted, OZ ERC20 already emits an Transfer event
  }

  function sellTokens(uint256 _amount, address _receiver) external {
    _requireAmountNotZero(_amount);

    // NOTE: owners must approve before we can do this
    rewardsToken.transferFrom(msg.sender, address(this), _amount);

    uint256 payout = _amount * pricePerToken;
    (bool success,) = payable(_receiver).call{ value: payout }("");
    require(success);
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
