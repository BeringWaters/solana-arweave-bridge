import { Job } from 'bullmq';
import arweaveAPI from './api/Arweave.api';
import solanaAPI from './api/Solana.api';
import { MAX_SLOT_CHUNK_SIZE, OPTIONS } from './config';
import { redis, redisCleanup } from './service/Redis.service';
import { LAST_SAVED_SLOT } from './service/Queue.service';
import { fetchingTxsQueue, WALLET_BALANCE, walletBalanceQueue } from './service/Queue.service';
import { txPostingWorker } from './worker/Arweave.posting.worker';
import { txFetchingWorker } from './worker/Solana.fetching.worker';

const fetchSlots = async (first, last) => {
  console.log('Fetching confirmed blocks:');
  const fetchedSlots = [];
  let lastFetchedSlot = first;
  try {
    while (lastFetchedSlot - last < MAX_SLOT_CHUNK_SIZE) {
      const lastSlotToFetch = lastFetchedSlot + MAX_SLOT_CHUNK_SIZE;
      const { result: confirmedSlotsChunk } = await solanaAPI.getConfirmedBlocks(lastFetchedSlot, lastSlotToFetch > last ? last : lastSlotToFetch);
      fetchedSlots.push(...confirmedSlotsChunk);
      lastFetchedSlot = lastSlotToFetch;
      console.log(`${fetchedSlots.length}/${last - first + 1}`)
    }
  } catch (e) {
    console.log(`Failed to get confirmed slots: ${e.message}`);
    return [];
  }
  return fetchedSlots;
};

export const start = async () => {
  await redisCleanup();
  const balance = await arweaveAPI.getWalletBalance();
  await redis.set(WALLET_BALANCE, balance);
  console.log(`Wallet balance ${balance} winston`);
  await walletBalanceQueue.add(WALLET_BALANCE, {},{
    repeat: {
      every: 60000,
    }
  });

  console.log('Arweave initialization...');
  console.log('Blocks fetching started...');

  const livestream = OPTIONS.livestream && !(OPTIONS.lastSlot === undefined);
  const firstSlot = parseInt(OPTIONS.firstSlot,10) || await solanaAPI.getCurrentSlot();
  const lastSlot = parseInt(OPTIONS.lastSlot,  10) || firstSlot;

  /**
   * Get all confirmed Solana slots
   */
  const confirmedSlots = await fetchSlots(firstSlot, lastSlot);

  txFetchingWorker.on('completed', async () => {
    const nextSlot = confirmedSlots.shift();
    if (!nextSlot) {
      if (!livestream) return;

      const first = await redis.get(LAST_SAVED_SLOT);
      const last = await solanaAPI.getCurrentSlot();
      const fetchedSlots = await fetchSlots(first + 1, last);
      await redis.set(LAST_SAVED_SLOT, last);

      if (!fetchedSlots.length) return;

      confirmedSlots.push(...fetchedSlots);
      console.log(`Fetched new portion of slots: ${fetchedSlots.length}`);
    }
    await fetchingTxsQueue.add(`${nextSlot}`, nextSlot);
    console.log(`Slot ${nextSlot} added to queue`);
  });

  txFetchingWorker.on('failed', async (job: Job) => {
    const { data: slot } = job;
    await fetchingTxsQueue.add(`${slot}`, slot);
  });

  await redis.set(LAST_SAVED_SLOT, confirmedSlots.slice(-1)[0]);

  const concurrency = OPTIONS.concurrency || 1;

  txFetchingWorker.opts.concurrency = concurrency;
  txPostingWorker.opts.concurrency = concurrency;

  const length = confirmedSlots.length;
  for (let i = 0; i < (concurrency * 10) && i < length; ++i) {
    const slot = confirmedSlots.shift();
    await fetchingTxsQueue.add(`${slot}`, slot)
  }
};
