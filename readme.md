This project is a bridge to connect Solana ledger data to Arweave permanent storage

Here is the engineering proposal: https://docs.google.com/document/d/1udZ0Ce83gYfnjIVSyteUz5hqUwUpoot-ffM3dSd5HvE/edit#

To run this project please provide the solana node endpoint to .env file:

`SOLANA_NODE_URL=http://api.mainnet-beta.solana.com`

There are three public nodes in solana if you don't want to create your own:

```
http://devnet.solana.com
http://testnet.solana.com
http://api.mainnet-beta.solana.com
```

Also you need to provide **Arweave** wallet. To create the wallet please go to https://www.arweave.org/wallet#/wallet

Finally, somewhere somehow you should download file with the name smth like `arweave-keyfile-QkbQ9Cq7x6I7Jnmw5mePKDSEVavTMvABBPMJY6nGZLY.josn`
It's private key for your wallet, and it should look like this

```
{
"kty": "R...
"n": "w_y...
"e": "AQA...
"d": "h7C...
"p": "5R0...
"q": "2vw...
"dp": "hL...
"dq": "H0...
"qi": "wR...
}
```

You may install `arweave-deploy` https://docs.arweave.org/developers/tools/arweave-deploy, set up the wallet and check the balance according to the documentation.

Copy your file `arweave-keyfile-***` to the root of the project. Add `KEY_PATH=arweave-keyfile-***` to your `.env` file.

Run `yarn start`.

See that fetching started...

Have a good coding and please update this file if you find smth more.

Useful links:

https://github.com/ArweaveTeam/arweave-js

There is a search in discord. Sometimes it helpful:


https://solana.com/discord

https://discord.gg/XzW3cpv



