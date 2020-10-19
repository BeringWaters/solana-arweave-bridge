import * as Redis from 'ioredis';
import { REDIS_OPTIONS } from '../config';

export const NEXT_START_SLOT = 'NEXT_START_SLOT';
export const LAST_FETCHED_SLOT= 'LAST_FETCHED_SLOT';
export const SAVED_BLOCKS_SET = 'SAVED_BLOCKS_SET';
export const WALLET_BALANCE = 'WALLET_BALANCE';
export const AR_SPENT = 'AR_SPENT';
export const AR_SPENT_UNCONFIRMED = 'AR_SPENT_UNCONFIRMED';

export let redis;

export const initializeRedisService = async () => {
  const { port, host } = REDIS_OPTIONS;
  redis = new Redis(port, `${host}`);
};

export const redisCleanup = async () => {
  await redis.set(NEXT_START_SLOT, null);
  await redis.set(LAST_FETCHED_SLOT, null);
  await redis.set(WALLET_BALANCE, null);
  await redis.set(AR_SPENT, null);
  await redis.set(AR_SPENT_UNCONFIRMED, null);
};
