export const WINSTON_TO_AR = 10e12;

export const MAX_TAGS_SIZE = 2048;

export const SOLANA_NETWORKS = {
  'http://devnet.solana.com': {
    alias: '0',
  },
  'http://testnet.solana.com': {
    alias: '1',
  },
  'http://api.mainnet-beta.solana.com': {
    alias: '2',
  },
};

export const ARWEAVE_GRAPHQL = 'https://arweave.dev/graphql';

export const TX_TAGS = {
  numReadonlySignedAccounts: {
    path: ['message', 'header', 'numReadonlySignedAccounts'],
    alias: 'a',
    iterable: false,
  },
  numReadonlyUnsignedAccounts: {
    path: ['message', 'header', 'numReadonlyUnsignedAccounts'],
    alias: 'b',
    iterable: false,
  },
  numRequiredSignatures: {
    path: ['message', 'header', 'numRequiredSignatures'],
    alias: 'c',
    iterable: false,
  },
  signature: {
    path: ['signatures'],
    alias: 'd',
    iterable: true,
  },
  accountKey: {
    path: ['message', 'accountKeys'],
    alias: 'e',
    iterable: true,
  },
  programIdIndex: {
    path: ['message', 'instructions'],
    subPath: ['programIdIndex'],
    alias: 'f',
    iterable: true,
  },
};

export const BLOCK_TAGS = {
  block: {
    alias: '0',
  },
  slot: {
    alias: '1',
  },
  container: {
    alias: '2',
  },
  blockhash: {
    alias: '3',
  },
  network: {
    alias: '4',
  },
  database: {
    alias: '5',
  },
};
