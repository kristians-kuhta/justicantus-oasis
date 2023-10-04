const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

function writeContractArtifacts(platform) {
  const contractsDirs = [
    "../frontend/src/contracts",
    "../cloud_functions/contracts",
    "../cloud_functions/functions/pinFile/contracts",
    "../cloud_functions/functions/decryptPinnedFile/contracts",
    "../build",
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
  const platform = await Platform.attach(process.env.PLATFORM_ADDRESS);

  writeContractArtifacts(platform);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
