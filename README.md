# Justicantus on Oasis
This is a version of the [Justicantus](https://github.com/kristians-kuhta/justicantus) music streaming service on Oasis.
The Oasis protocol is leveraged to ensure that audio files are encrypted before sending them over to the IPFS as well
as ensuring users can use the platform by preserving privacy of their data.
The audio file is decrypted when a subscriber listens to them.

# About Justicantus
Digital music service empowering Artists with Ethical Music Streaming on the Blockchain.

Read more about the project [here](docs/about_justicantus.md).

Read more about the technical overview [here](docs/technical_overview.md).

## Technologies used
The project is a full-stack dapp, intended to be used inside of a browser.

Smart contracts are written in Solidity and the project used Hardhat as the development environment for the smart contracts.

Oasis Sapphire native random number generator is being used to generate unique identifiers for artists and their songs.

The frontend is written in JavaScript in the form of a React application.

Frontend communicates directly with the Oasis Sapphire node via JSON RPC.

## Development setup

Here are the things that you need to do in order to start up the development environment.

## Populate the .env file

Go ahead and copy `.env.example` file to `.env` file located at the root of the Hardhat project.

## Start Hardhat node and deploy contracts
Clone the project, navigate to the project root directory, and run `npm install` to install the Hardhat project packages.

Then start up the local hardhat node by running

```shell
npx hardhat node
```

This will start up a new hardhat node instance, available on `http://127.0.0.1:8545/` or `http://localhost:8545/`.

Then run the `bin/dev` script which will deploy the smart contracts, update contract ABIs, add "reporter" and "encryptor" addresses, and add 3 subscription plans.

At this point, the smart contracts and the local hardhat node are ready to be used by the frontend.

## Run Google Cloud functions locally

The project uses Google Cloud functions (to proxy IPFS API and to register played song seconds).

Navigate to `cloud_functions` and do the following steps:
1. Make sure you have [gcloud](https://cloud.google.com/sdk/docs/install) installed
2. Run `npm install`
3. Start up Firestore emulator `npm run emulate-firestore`
4. Start up `trackPlayback` function: `npm run emulate-trackPlayback`
5. Start up `updatePlayedMinutes` function: `npm run emulate-updatePlayedMinutes`
6. Start up `pinFile` function: `cd functions/pinFile` (fill in the `.env` file located in the `pinFile` directory before running this)
7. Start up `decryptPinnedFile` function: `cd functions/decryptPinnedFile` (fill in the `.env` file located in the `decryptPinnedFile` directory before running this)
8. Make sure that none of the steps had any errors in them

If you would rather deploy actual LIVE functions instead of using the local ones, follow the steps below.

Make sure you have [gcloud](https://cloud.google.com/sdk/docs/install) installed, change the directory to `cloud_functions`, and deploy both of the cloud functions with these commands

```
gcloud functions deploy pinFile --runtime nodejs14 --trigger-http --env-vars-file .env.yaml
gcloud functions deploy decryptPinnedFile --runtime nodejs20 --trigger-http --env-vars-file .env.yaml
```

NOTE: something similar should work for the `trackPlayback` and `updatePlayedMinutes` functions.
These will be documented in the next iterations of this document.
The `.env.yaml` files have to be created if they haven't been created yet.

You can get the project ID by running

```
gcloud config get project
```

## Start the React server
In order to interact with the app frontend you must start React dev server.

Navigate to `frontend` directory and run

```
npm install
npm start
````

Then visit `http://localhost:3000` in your browser.

## Running tests
The project has these types of tests:
* smart contract unit tests

To run the smart contract tests, navigate to project root, make sure you have ran `npm install` and run
```
npx hardhat test
````

## Contributions

TBD. This section will be updated soon.

## Created by
* Kristians Kuhta ([kristians-kuhta](https://github.com/kristians-kuhta))
