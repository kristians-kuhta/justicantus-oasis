// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract JustToken is ERC20 {
  constructor() ERC20('JUST token', 'JUST') {}
}
