# Solana-Arweave Bridge

This utility is a bridge to connect Solana ledger data to Arweave permanent storage</h4>

## Setup
* Install Solana-Arweave Bridge dependencies:
```bash
yarn install
```

* Build Solana-Arweave Bridge:
```bash
yarn build
```

* Install and start Redis server

## Usage
### CLI
* Register CLI application:
```bash
npm install -g .
```

* Run CLI application:
```bash
$ solana-arweave-bridge <command> <options>
```

* If you don't want to register the package globally you can simply run:
```bash
$ ./bin/cli.js <command> <options>
```

#### Commands:
*  `stream`: Start the bridge to transferring Solana historical data to Arweave with specified options
*  `livestream`: Start the bridge to livestreaming Solana data to Arweave with specified options
*  `search`: Search transactions by tag value

#### Options:
##### stream
*  `-s, --startslot`: *[number, required]* Number of the first Solana slot to transfer.
*  `-e, --endslot`: *[number, required]* Number of the last Solana slot to transfer.
*  `-c, --concurrency`: *[number, optional]* Number of Bull threads to perform fetching and writing jobs. Default: .env.CONCURRENCY || 16
*  `-k, --key`: *[string, optional]* Path to Arweave key. Default: .env.ARWEAVE_KEY_PATH || 'arweave-keyfile.json'
*  `-d, --database`: *[string, optional]* Tag to identify bridge session. Default: .env.DATABASE || 'dev'
*  `-v, --verify`: *[boolean, optional]* Check if Arweave transaction with specified set of block tags already exists. Default: true
*  `-n, --network`: *[string, optional]* Solana node URL. Default: .env.SOLANA_NODE_URL || 'http://testnet.solana.com'
*  `-r, --rpc`: *[string, optional]* Solana rpc version. Default: .env.SOLANA_RPC || '2.0'
*  `-p, --redisport`: *[number, optional]* Port of a Redis instance. Default: .env.REDIS_PORT || 6379
*  `-h, --redishost`: *[string, optional]* Host of a Redis instance. Default: .env.REDIS_HOST || '127.0.0.1'

##### livestream
*  `-c, --concurrency`: *[number, optional]* Number of Bull threads to perform fetching and writing jobs. Default: .env.CONCURRENCY || 16
*  `-k, --key`: *[string, optional]* Path to Arweave key. Default: .env.ARWEAVE_KEY_PATH || 'arweave-keyfile.json'
*  `-d, --database`: *[string, optional]* Tag to identify bridge session. Default: .env.DATABASE || 'dev'
*  `-v, --verify`: *[boolean, optional]* Check if Arweave transaction with specified set of block tags already exists. Default: true
*  `-n, --network`: *[string, optional]* Solana node URL. Default: .env.SOLANA_NODE_URL || 'http://testnet.solana.com'
*  `-r, --rpc`: *[string, optional]* Solana rpc version. Default: .env.SOLANA_RPC || '2.0'
*  `-p, --redisport`: *[number, optional]* Port of a Redis instance. Default: .env.REDIS_PORT || 6379
*  `-h, --redishost`: *[string, optional]* Host of a Redis instance. Default: .env.REDIS_HOST || '127.0.0.1'

##### search
*  `--tagname`: *[string, required]* Tag name
*  `--tagvalue`: *[string, required]* Tag value

## Tags
The application operates with two types of tags:
*  Tags that correspond to a single Solana transaction
*  Tags that correspond to a single Solana block (multiple Solana transactions)

Transaction tags are described by the structure:
*  `path`: Path to value in a Solana transaction object
*  `alias`: Tag name alias, to reduce the overall size of tags
*  `iterable`: Determines if the tag value is an array

Block tags are described by the structure:
*  `alias`: Tag name alias, to reduce the overall size of tags

Below is the current description of tags
```javascript
TX_TAGS = {
  'numReadonlySignedAccounts': {
    path: ['message', 'header', 'numReadonlySignedAccounts'],
    alias: 'a',
    iterable: false,
  },
  'numReadonlyUnsignedAccounts': {
    path: ['message', 'header', 'numReadonlyUnsignedAccounts'],
    alias: 'b',
    iterable: false,
  },
  'numRequiredSignatures': {
    path: ['message', 'header', 'numRequiredSignatures'],
    alias: 'c',
    iterable: false,
  },
  'signature': {
    path: ['signatures'],
    alias: 'd',
    iterable: true,
  },
  'accountKey': {
    path: ['message', 'accountKeys'],
    alias: 'e',
    iterable: true,
  },
  'programIdIndex': {
    path: ['message', 'instructions'],
    subPath: ['programIdIndex'],
    alias: 'f',
    iterable: true,
  },
};

BLOCK_TAGS = {
  'block': {
    alias: '0',
  },
  'slot': {
    alias: '1',
  },
  'container': {
    alias: '2',
  },
  'blockhash': {
    alias: '3',
  },
  'network': {
    alias: '4',
  },
  'database': {
    alias: '5',
  },
};
```
