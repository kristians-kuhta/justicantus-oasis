require("@nomicfoundation/hardhat-toolbox");
require('@oasisprotocol/sapphire-hardhat');

require('dotenv').config();

task(
  'add_subscription_plan',
  'Add a subscription plan'
).addPositionalParam('price').addPositionalParam('duration').setAction(
  async ({ price, duration }, hre, runSuper) => {
    const contractAddresses = require('./build/contract-addresses.json');

    const Platform = await ethers.getContractFactory("Platform");
    const platform = await Platform.attach(contractAddresses.Platform);

    await (await platform.setSubscriptionPlan(price, duration, { gasLimit: 300000 })).wait();
    console.log(`Added a subscription plan: ${hre.ethers.utils.formatEther(price)} ETH for timestamp increase of ${duration}`);
  }
);

task(
  'add_reporter',
  'Add a reporter account'
).addPositionalParam('reporter').setAction(
  async ({ reporter }, _hre, _runSuper) => {
    const contractAddresses = require('./build/contract-addresses.json');

    const Platform = await ethers.getContractFactory("Platform");
    const platform = await Platform.attach(contractAddresses.Platform);

    await (await platform.addReporter(reporter, { gasLimit: 300000 })).wait();
    console.log(`Added a reporter: ${reporter}`);
  }
);

const {
  RPC_PROVIDER_URL,
  SEPOLIA_PRIVATE_KEY,
  ETHERSCAN_API_KEY
}  = process.env;

module.exports = {
  solidity: "0.8.19",
  settings: {
    optimizer: {
      enabled: true,
      runs: 400,
    }
  },
  networks: {
    sepolia: {
      url: RPC_PROVIDER_URL || '',
      accounts: [SEPOLIA_PRIVATE_KEY || '']
    },
    sapphire_localnet: {
      url: 'http://localhost:8545',
      accounts: process.env.LOCAL_PRIVATE_KEY
        ? [process.env.LOCAL_PRIVATE_KEY]
        : [],
      chainId: 0x5afd
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  }
};
