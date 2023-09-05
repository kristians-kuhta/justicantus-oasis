const hre = require('hardhat');
const fs = require('fs');
const path = require('path');
const _sodium = require('libsodium-wrappers');

function saveFrontendFiles(platform) {
  const contractsDirs = [
    "../frontend/src/contracts",
    "../cloud_functions/contracts",
    "../build",
    "../justicantus-subgraph/abis"
  ];

  // `artifacts` is a helper property provided by Hardhat to read artifacts
  const PlatformArtifact = artifacts.readArtifactSync("Platform");
  const JustTokenArtifact = artifacts.readArtifactSync("JustToken");

  contractsDirs.forEach(async (contractsDir) => {
    const contractsPath = path.join(__dirname, contractsDir);

    if (!fs.existsSync(contractsPath)) {
      fs.mkdirSync(contractsPath);
    }

    const justTokenAddress = await platform.rewardsToken();

    fs.writeFileSync(
      contractsPath + "/contract-addresses.json",
      JSON.stringify({ Platform: platform.address, JustToken: justTokenAddress }, null, 2)
    );

    fs.writeFileSync(
      contractsPath + "/Platform.json",
      JSON.stringify(PlatformArtifact, null, 2)
    );

    fs.writeFileSync(
      contractsPath + "/JustToken.json",
      JSON.stringify(JustTokenArtifact, null, 2)
    );

    console.log(`Artifacts written to ${contractsPath} directory`);
  });
}

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

  console.log('[Deploy] Saving deploy artifacts...');

  saveFrontendFiles(platform);

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
