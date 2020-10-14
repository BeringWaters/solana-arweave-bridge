import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

export const MAX_SLOT_CHUNK_SIZE = parseInt(process.env.MAX_SLOT_CHUNK_SIZE, 10) || 100000;

export const MAX_RESPONSE_ATTEMPTS = parseInt(process.env.MAX_RESPONSE_ATTEMPTS, 10) || 5;

export const TX_STATUS_POLLING_DELAY = parseInt(process.env.TX_STATUS_POLLING_DELAY, 10) || 1000;

export const TX_STATUS_POLLING_ATTEMPTS = parseInt(process.env.TX_STATUS_POLLING_ATTEMPTS, 10) || 960;

export const TX_NUMBER_OF_CONFIRMATIONS = parseInt(process.env.TX_NUMBER_OF_CONFIRMATIONS, 10) || 1;

export const CONCURRENCY = parseInt(process.env.CONCURRENCY, 10) || 4;

export const OPTIONS = {
  firstSlot: undefined,
  lastSlot: undefined,
  livestream: false,
  database: process.env.DATABASE || 'dev',
  concurrency: parseInt(process.env.CONCURRENCY, 10) || 4,
  compressed: false,
  verify: true,
  benchmark: false,
  keyPath: process.env.ARWEAVE_KEY_PATH,
};

export const ARWEAVE_OPTIONS = {
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
  timeout: 20000,
  logging: false,
};

export const SOLANA_OPTIONS = {
  url: process.env.SOLANA_NODE_URL || 'https://testnet.solana.com',
  jsonrpc: process.env.SOLANA_RPC || '2.0',
};

export const updateOptions = (params = {}) => {
  Object.keys(params).forEach((key) => {
    if (params[key] === undefined) return;
    OPTIONS[key] = params[key];
  });
};

export const updateSolanaOptions = (params = {}) => {
  Object.keys(params).forEach((key) => {
    if (params[key] === undefined) return;
    SOLANA_OPTIONS[key] = params[key];
  });
};
