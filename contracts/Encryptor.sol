// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import { SharedStorage } from "./SharedStorage.sol";

contract Encryptor is Ownable, SharedStorage {
  event EncryptorAdded(address indexed account);
  event EncryptorRemoved(address indexed account);

  error AccountIsEncryptor();

  function addEncryptor(address account) external onlyOwner {
    _requireAccountNotEncryptor(account);

    encryptors[account] = true;

    emit EncryptorAdded(account);
  }

  function removeEncryptor(address account) external onlyOwner {
    _requireAccountIsEncryptor(account);

    encryptors[account] = false;

    emit EncryptorRemoved(account);
  }

  function _requireAccountNotEncryptor(address account) internal view {
    if (encryptors[account]) {
      revert AccountIsEncryptor();
    }
  }
}
