// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract JustToken is ERC20, Ownable {
  constructor() ERC20('JUST token', 'JUST') {}

  function mint(address account, uint256 amount) external onlyOwner {
    _mint(account, amount);
  }
}
