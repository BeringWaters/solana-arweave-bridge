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
    url: process.env.SOLANA_NODE_URL || 'https://devnet.solana.com',
    jsonrpc: '2.0',
};

export const ARWEAVE_ADDRESS = 'QkbQ9Cq7x6I7Jnmw5mePKDSEVavTMvABBPMJY6nGZLY';

export const MAX_SLOT_CHUNK_SIZE = 500000;

export const WINSTON_TO_AR = 10e12;
