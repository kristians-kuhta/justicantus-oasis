// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

import { SharedStorage } from "./SharedStorage.sol";

contract EncryptionKey is SharedStorage {
  constructor(bytes32 _encryptionKey) {
    // NOTE: In the scope of smart contracts, we do not really care what is being put here.
    //       Nevertheless, this will most likely hold ChaCha20 symmetric key.
    encryptionKey = _encryptionKey;
  }

  function getEncryptionKey(address account, bytes calldata signature) external view returns (bytes32) {
    _requireAccountIsEncryptor(account);
    _requireSignatureValid(account, signature);

    return encryptionKey;
  }

}
