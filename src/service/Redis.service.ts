import * as Redis from 'ioredis';
import {
  AR_SPENT,
  AR_SPENT_UNCONFIRMED,
  LAST_SAVED_SLOT,
  WALLET_BALANCE,
  fetchingTxsQueue,
  pendingTxsQueue,
  postingTxsQueue,
} from './Queue.service';

export const redis = new Redis();

export const redisCleanup = async () => {
  await redis.set(WALLET_BALANCE, null);
  await redis.set(AR_SPENT, null);
  await redis.set(AR_SPENT_UNCONFIRMED, null);
  await redis.set(LAST_SAVED_SLOT, null);

  await fetchingTxsQueue.clean(0, 0);
  await fetchingTxsQueue.clean(0,0,  'wait');
  await fetchingTxsQueue.clean(0,0,  'active');
  await fetchingTxsQueue.clean(0,0,  'completed');
  await fetchingTxsQueue.clean(0,0,  'delayed');
  await fetchingTxsQueue.clean(0,0,  'failed');

  await pendingTxsQueue.clean(0, 0);
  await pendingTxsQueue.clean(0,0,  'wait');
  await pendingTxsQueue.clean(0,0,  'active');
  await pendingTxsQueue.clean(0,0,  'completed');
  await pendingTxsQueue.clean(0,0,  'delayed');
  await pendingTxsQueue.clean(0,0,  'failed');

  await postingTxsQueue.clean(0, 0);
  await postingTxsQueue.clean(0,0,  'wait');
  await postingTxsQueue.clean(0,0,  'active');
  await postingTxsQueue.clean(0,0,  'completed');
  await postingTxsQueue.clean(0,0,  'delayed');
  await postingTxsQueue.clean(0,0,  'failed');
};
