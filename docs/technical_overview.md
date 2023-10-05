# Technical overview of Justicantus on Oasis

The platform is deployed on Oasis Sapphire.
The platform users visit the webpage and sign in with their wallets.

The user is offered to subscribe to a plan.
Upon using the platform for the first time, the user is asked to sign a signature that gets stored in the browser's local storage.

Subscription plans are configured by the smart contract owner.
Currently, we plan to have 3 plans, the longer the selected duration, the cheaper the plan.

Once the user subscribes, all platform artist's songs can be played except for the exclusive ones.
Exclusive songs are songs that artists set a price for and users have to buy them in order to listen to them.

Users can then search for artists, open their songs list, and play their songs.

When an artist uploads a song, it gets encrypted and stored in the IPFS.
We use ChaCha20-Poly1305 encryption.
Then when a user views a list of songs or listens to a particular song the song metadata is fetched from IPFS and decrypted.

There is an event where users are allowed to vote for the monthly song.
During this event, users can submit votes.

After the voting period ends contract owner can close the voting period, paying out the voters their share of the voting prize pool.
The prizes are paid out in JUST tokens.
These tokens can then be used to purchase exclusive content or withdraw them from the platform in return for ROSE.

The player tracks how many seconds of songs have been played.
Every 10 seconds played, an update is sent to the back-end server with information about
the artist (its ID), the song (its ID), and the listener (his address and the subscription signature from local storage).

For the backend, we use a Google Cloud Function with Firestore as the database.

Upon receiving the above-mentioned update,
it stores `lastTrackedSong` record which contains information about:
* `account`
* `songId`
* `duration`

When the tracking event is being registered, we check if the last tracked song record exists for this `songId` and if the current duration is more than it was.
If so we assume that the user continues to listen to the song with the ID of `songId` and we add the newly listened seconds to the played seconds of the song.

Then there is a Google Cloud function that sends a batch update to the smart contract.
It migrates data about the artist's new played minutes to the smart contract.
Updates can be done only by `reporter` accounts. The platform owner can mark an account as a `reporter` account.

This function is intended to be called by a scheduler, e.g. every 8 hours or so.

The platform owner can set a reward for a single played minute in WEI.
The artists then can claim unclaimed played minutes at any time and receive a payout in ROSE.

Any ROSE that is unspent (unplayed minutes in a month) remains on the platform and is considered
platform fee.



