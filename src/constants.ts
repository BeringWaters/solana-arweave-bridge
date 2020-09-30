export const WINSTON_TO_AR = 10e12;

export const MAX_TAGS_SIZE = 2048;

export const SOLANA_NETWORKS = [
  'http://devnet.solana.com',
  'http://testnet.solana.com',
  'http://api.mainnet-beta.solana.com',
];

export const NETWORK_ALIAS = {
  'http://devnet.solana.com': '0',
  'http://testnet.solana.com': '1',
  'http://api.mainnet-beta.solana.com': '2',
};

export const TAG_ALIAS = {
  'slot': '1',
  'container': '2',
  'blockhash': '3',
  'network': '4',
  'database': '5',
  'numReadonlySignedAccounts': 'a',
  'numReadonlyUnsignedAccounts': 'b',
  'numRequiredSignatures': 'c',
  'signature': 'd',
  'accountKey': 'e',
  'programIdIndex': 'f',
};
