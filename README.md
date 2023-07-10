# Justicantus
Digital music service empowering Artists with Ethical Music Streaming on the Blockchain.

Read more about the project [here](docs/about_justicantus.md).

Read more about the technical overview (currently assumed project architecture) [here](docs/technical_overview.md).

## Technologies used
The project is a full-stack dapp, intended to be used inside of a browser.

Smart contracts are written in Solidity and the project used Hardhat as the development environment for the smart contracts.

Chainlink VRF random number generator is being used to generate unique identifiers for artists and their songs.

The frontend is written in JavaScript in the form of a React application.
Artists are being indexed in a subgraph (The Graph protocol).

Frontend both communicates directly with the Ethereum node via JSON RPC and also uses GraphQL to fetch a list of artists from a subgraph.

## Development setup

Here are the things that you need to do in order to start up the development environment.

Clone the project, navigate to the directory, and run `npm install` to install the Hardhat project packages.

Then start up the local hardhat node by running

```shell
npx hardhat node
```

This will start up a new hardhat node instance, available on `http://127.0.0.1:8545/` or `http://localhost:8545/`.

Then run the `bin/dev` script which will deploy the smart contracts and add 3 subscription plans.

At this point, the smart contracts and the local hardhat node are ready to be used by the frontend.

But in order for the frontend to be able to render the list of artists you also have to start up a local graph node.

Navigate to the `justicantus-subgraph` and install npm packages.
The subgraph uses yarn as the package manager, so run 

```shell
yarn
```

to install the packages.

Then navigate to `docker/graph-node` directory, make sure you have a running docker instance, and run the graph node by executing
```shell
docker-compose up
```

Now once you have a running graph node you need to create a new subgraph and deploy the subgraph.

Create a subgraph by navigating to `justicantus-subgraph` and doing:
```
graph create --node http://localhost:8020/ your-github-username/justicantus-subgraph
```
At the moment you need to change the `justicantus-subgraph/subgraph.yaml` file and set the correct deployment address for the first data source, which can be obtained from the output of `bin/dev` script or within the `frontend/src/contracts/contract-addresses.json` file.
This might be changed in the next iterations.

Deploy a subgraph by doing:
```
graph deploy --node http://localhost:8020/ --ipfs http://127.0.0.1:5001/ your-github-username/justicantus-subgraph
```

Select any version number, e.g. `0.0.1`.

Check your graph node logs to see if the subgraph was created and deployed.
Look for "ERROR", "error" or similar patterns.

If see any errors, try deleting the `docker/graph-node/data` directory content and restarting your docker container.

To test out if the subgraph performs the indexing correctly, complete the full artist registration, check graph node logs, and finally check the "Artists" page.
If the artist shows up there, the setup is working as expected.

## Artist and song registration

Artists and songs have unique IDs that are generated by Chainlink VRF random number generator.
In testnet and mainnet dapps, this will use the actual Chainlink smart contracts, but in the development environment, you have to manually fulfill random number generation requests.

To do that open your browser dev console and start artist or song registration.
After confirming the transaction in Metamask and once it will be accepted on your local hardhat node, you will see something like this:

```
  [Artist] npx hardhat vrf_fulfill 1 123 --network localhost
  (replace the 123 with the number you want to be assigned)'
```

As you might have guessed from the message, you need to choose what kind of (unique!!!) ID you want the artist or song to have and run the `vrf_fulfill` task.

`IMPORTANT`:
  Make sure that the selected ID is unique in the artist's or song's scope. 
  If you set the same ID for two songs this will overwrite data in the smart contract.

## Running tests
The project has these types of tests:
* smart contract unit tests
* subgraph tests

To run the smart contract tests, navigate to project root, make sure you have ran `npm install` and run 
```
npx hardhat test
````

To run the subgraph tests:
* navigate to `justicantus-subgraph`
* make sure docker is running
* run tests with `graph build && graph codegen && yarn test --docker --version 0.5.4`

## Contributions

TBD. This section will be updated soon.

## Created by
* Kristians Kuhta ([kristians-kuhta](https://github.com/kristians-kuhta))
