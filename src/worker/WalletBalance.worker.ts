import { Worker } from 'bullmq';
import arweaveAPI from '../api/Arweave.api';

import { redis, WALLET_BALANCE } from '../service/Redis.service';
import { FETCHING_BALANCE_QUEUE } from '../service/Queue.service';

export const walletBalanceWorker = new Worker(FETCHING_BALANCE_QUEUE, async () => {
  const balance = await arweaveAPI.getWalletBalance();
  await redis.set(WALLET_BALANCE, balance);
});
