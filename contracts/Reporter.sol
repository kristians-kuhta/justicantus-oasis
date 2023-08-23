// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import { SharedStorage } from "./SharedStorage.sol";

contract Reporter is Ownable, SharedStorage {
  event ReporterAdded(address indexed account);
  event ReporterRemoved(address indexed account);

  error AccountIsReporter();

  // ++++++++++++ External functions ++++++++++++++++++++++
  function addReporter(address account) external onlyOwner {
    _requireAccountNotReporter(account);

    reporters[account] = true;

    emit ReporterAdded(account);
  }

  function removeReporter(address account) external onlyOwner {
    _requireAccountIsReporter(account);

    reporters[account] = false;

    emit ReporterRemoved(account);
  }
  // ++++++++++++++++++++++++++++++++++++++++++++++++++++++

  // ++++++++++++ Validation functions ++++++++++++++++++++++
  function _requireAccountNotReporter(address account) internal view {
    if (reporters[account]) {
      revert AccountIsReporter();
    }
  }
  // ++++++++++++++++++++++++++++++++++++++++++++++++++++++

}
