const hre = require('hardhat');
const fs = require('fs');
const path = require('path');
const _sodium = require('libsodium-wrappers');

async function main() {
  const Platform = await hre.ethers.getContractFactory('Platform');

  const {
    NODE_ENV,
    REWARDS_FOR_PROPOSAL,
    PRICE_PER_TOKEN,
  } = process.env;

  console.log('[Deploy] Deploying platform...');
  await _sodium.ready;
  const sodium = _sodium;
  const generatedKey = await sodium.crypto_secretstream_xchacha20poly1305_keygen();
  const encryptionKey = '0x' + Buffer.from(generatedKey).toString('hex');

  platform = await Platform.deploy(
    REWARDS_FOR_PROPOSAL,
    PRICE_PER_TOKEN,
    encryptionKey
  );
  console.log('[Deploy] Deploy tx send...');

  await platform.deployed();

  console.log(
    `[Deploy] DONE!\nPlatform deployed to ${platform.address} with rewards for proposal of ${REWARDS_FOR_PROPOSAL} and price per token of ${PRICE_PER_TOKEN}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
