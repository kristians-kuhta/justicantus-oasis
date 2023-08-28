// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

import { SharedStorage } from "./SharedStorage.sol";

contract EncryptionKey is SharedStorage {
  error InvalidSignature();

  string private constant SIGNATURE_PREFIX = "\x19Ethereum Signed Message:\n32";

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

  function _requireSignatureValid(address account, bytes calldata signature) internal pure {
    // TODO: consider using the same approach for subscriber signatures
    bytes32 messageHash = keccak256(abi.encode(account));

    if (!_verifySignature(account, messageHash, signature)) {
      revert InvalidSignature();
    }
  }

  function _verifySignature(
    address signer,
    bytes32 messageHash,
    bytes calldata signature
  ) internal pure returns (bool) {

    (bytes32 r, bytes32 s, uint8 v) = _splitSignature(signature);

    bytes32 prefixedHash = keccak256(
      abi.encodePacked(SIGNATURE_PREFIX, messageHash)
    );
    address recoveredSigner = ecrecover(prefixedHash, v, r, s);

    // Check if the recovered public key matches the expected signer's address
    return recoveredSigner != address(0) && recoveredSigner == signer;
  }

  function _splitSignature(bytes calldata signature) internal pure
    returns (bytes32 r, bytes32 s, uint8 v) {
    r = bytes32(signature[0:32]);
    s = bytes32(signature[32:64]);
    v = uint8(bytes1(signature[64:65]));
  }
}
