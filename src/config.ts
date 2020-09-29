import * as dotenv from 'dotenv'

dotenv.config({ path: `.env` });

export const ARWEAVE_OPTIONS = {
    host: 'arweave.net',
    port: 443,
    protocol: 'https',
    timeout: 20000,
    logging: false,
    keyPath: process.env.KEY_PATH,
};

export const SOLANA_OPTIONS = {
    url: 'https://api.mainnet-beta.solana.com',
    jsonrpc: '2.0',
};

export const ARWEAVE_ADDRESS = 'QkbQ9Cq7x6I7Jnmw5mePKDSEVavTMvABBPMJY6nGZLY';

export const MAX_SLOT_CHUNK_SIZE = 100000;

export const WINSTON_TO_AR = 10e12;

export const MAX_TAGS_SIZE = 2048;

export const MAX_RESPONSE_ATTEMPTS = 5;

export const TX_STATUS_POLLING_DELAY = 30000;

export const TX_STATUS_POLLING_ATTEMPTS = 960;

export const TX_NUMBER_OF_CONFIRMATIONS = 1;
