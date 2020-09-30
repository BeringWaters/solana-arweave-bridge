import { Worker } from 'bullmq';
import { redis } from '../service/Redis.service';
import { WALLET_BALANCE } from '../service/Queue.service';
import arweaveAPI from '../api/Arweave.api';

const walletBalanceWorker = new Worker(WALLET_BALANCE, async () => {
  const balance = await arweaveAPI.getWalletBalance();
  await redis.set(WALLET_BALANCE, balance);
});
