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

task('remove_reporter', 'Remove a reporter account').addPositionalParam('reporter').setAction(
  async ({ reporter }, _hre, _runSuper) => {
    const contractAddresses = require('./build/contract-addresses.json');

    const Platform = await ethers.getContractFactory("Platform");
    const platform = await Platform.attach(contractAddresses.Platform);

    await (await platform.removeReporter(reporter, { gasLimit: 300000 })).wait();
    console.log(`Removed a reporter: ${reporter}`);
  }
);

task('set_rewards_per_proposal', 'Set rewards for proposal').addPositionalParam('rewards').setAction(
  async ({ rewards }, _hre, _runSuper) => {
    const contractAddresses = require('./build/contract-addresses.json');

    const Platform = await ethers.getContractFactory("Platform");
    const platform = await Platform.attach(contractAddresses.Platform);

    await (await platform.setRewardsPerProposal(rewards, { gasLimit: 300000 })).wait();
    console.log(`Set rewards per proposal: ${rewards}`);
  }
);

task('set_price_per_token', 'Set price per token').addPositionalParam('price').setAction(
  async ({ price }, _hre, _runSuper) => {
    const contractAddresses = require('./build/contract-addresses.json');

    const Platform = await ethers.getContractFactory("Platform");
    const platform = await Platform.attach(contractAddresses.Platform);

    await (await platform.setPricePerToken(price, { gasLimit: 300000 })).wait();
    console.log(`Set price per token: ${price}`);
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

task(
  'add_encryptor',
  'Add an encryptor account'
).addPositionalParam('encryptor').setAction(
  async ({ encryptor }, _hre, _runSuper) => {
    const contractAddresses = require('./build/contract-addresses.json');

    const Platform = await ethers.getContractFactory("Platform");
    const platform = await Platform.attach(contractAddresses.Platform);

    await (await platform.addEncryptor(encryptor, { gasLimit: 300000 })).wait();
    console.log(`Added an encryptor: ${encryptor}`);
  }
);

task(
  'remove_encryptor',
  'Remove an encryptor account'
).addPositionalParam('encryptor').setAction(
  async ({ encryptor }, _hre, _runSuper) => {
    const contractAddresses = require('./build/contract-addresses.json');

    const Platform = await ethers.getContractFactory("Platform");
    const platform = await Platform.attach(contractAddresses.Platform);

    await (await platform.removeEncryptor(encryptor, { gasLimit: 300000 })).wait();
    console.log(`Removed an encryptor: ${encryptor}`);
  }
);

task(
  'open_voting_period',
  'Open a voting period'
).addPositionalParam('endTimestamp').setAction(
  async ({ endTimestamp }, _hre, _runSuper) => {
    const contractAddresses = require('./build/contract-addresses.json');

    const Platform = await ethers.getContractFactory("Platform");
    const platform = await Platform.attach(contractAddresses.Platform);

    await (await platform.openVotingPeriod(endTimestamp, { gasLimit: 300000 })).wait();
    console.log(`Opened a voting period that end at: ${endTimestamp}`);
  }
);

task(
  'close_voting_period',
  'Close a voting period'
).setAction(
  async () => {
    const contractAddresses = require('./build/contract-addresses.json');

    const Platform = await ethers.getContractFactory("Platform");
    const platform = await Platform.attach(contractAddresses.Platform);

    const endTimestamp = await platform.votingPeriodEnds();
    await (await platform.closeVotingPeriod({ gasLimit: 300000 })).wait();
    console.log(`Closed the voting period that ended at: ${endTimestamp}`);
  }
);

const {
  RPC_PROVIDER_URL,
  SEPOLIA_PRIVATE_KEY,
  LOCAL_PRIVATE_KEY,
  SAPPHIRE_TESTNET_PRIVATE_KEY,
  ETHERSCAN_API_KEY
} = process.env;

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
      accounts: SEPOLIA_PRIVATE_KEY ? [SEPOLIA_PRIVATE_KEY] : [],
    },
    sapphire_localnet: {
      url: 'http://localhost:8545',
      accounts: LOCAL_PRIVATE_KEY ? [LOCAL_PRIVATE_KEY] : [],
      chainId: 0x5afd
    },
    sapphire_testnet: {
      url: 'https://testnet.sapphire.oasis.dev',
      accounts: SAPPHIRE_TESTNET_PRIVATE_KEY ? [SAPPHIRE_TESTNET_PRIVATE_KEY] : [],
      chainId: 0x5aff,
    },
    hardhat: {
      mining: {
        // Must be true otherwise view functions using block.timestamp might not work
        auto: true,
        interval: 5000
      }
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  }
};
