import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

export const MAX_RESPONSE_ATTEMPTS = parseInt(process.env.MAX_RESPONSE_ATTEMPTS, 10) || 5;

export const TX_STATUS_POLLING_DELAY = parseInt(process.env.TX_STATUS_POLLING_DELAY, 10) || 15000;

export const TX_STATUS_POLLING_ATTEMPTS = parseInt(process.env.TX_STATUS_POLLING_ATTEMPTS, 10) || 960;

export const TX_NUMBER_OF_CONFIRMATIONS = parseInt(process.env.TX_NUMBER_OF_CONFIRMATIONS, 10) || 1;

export const SLOTS_PER_THREAD = parseInt(process.env.SLOTS_PER_THREAD, 10) || 10;

export const WALLET_BALANCE_POLLING_TIMEOUT = parseInt(process.env.WALLET_BALANCE_POLLING_TIMEOUT, 10) || 30000;

export const LIVESTREAM_POLLING_TIMEOUT = parseInt(process.env.LIVESTREAM_POLLING_TIMEOUT, 10) || 200;

export const OPTIONS = {
  concurrency: parseInt(process.env.CONCURRENCY, 10) || 16,
  database: process.env.DATABASE || 'dev',
  key: process.env.ARWEAVE_KEY_PATH || 'arweave-keyfile',
  verify: true,
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

export const REDIS_OPTIONS = {
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  host: process.env.REDIS_HOST || '127.0.0.1',
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

export const updateRedisOptions = (params = {}) => {
  Object.keys(params).forEach((key) => {
    if (params[key] === undefined) return;
    REDIS_OPTIONS[key] = params[key];
  });
};
