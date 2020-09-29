import {
  LAST_SAVED_SLOT,
  POSTING_TXS_QUEUE,
  PENDING_TXS_QUEUE,
  saveBlockToArweave,
  SAVED_TXS_QUEUE,
  WALLET_BALANCE,
  AR_SPENT,
  AR_SPENT_UNCONFIRMED,
} from './Arweave.worker';
import arweaveAPI from '../api/Arweave.api';

import {Job, Queue, Worker} from 'bullmq';
import { getConfirmedBlocks, getConfirmedBlock, getCurrentSlot, getFirstSlot } from '../api/Solana.api';
import {MAX_SLOT_CHUNK_SIZE, TX_NUMBER_OF_CONFIRMATIONS} from '../config';

import * as Redis from 'ioredis';
const redis = new Redis();

export const FETCHING_TXS_QUEUE = 'FETCHING_TXS_QUEUE';
const fetchingTxsQueue = new Queue(FETCHING_TXS_QUEUE, { defaultJobOptions: { timeout: 60000 } });
const walletBalanceQueue = new Queue(WALLET_BALANCE, { defaultJobOptions: { timeout: 60000 } });

const redisCleanupOnRestart = async () => {
  await redis.set(LAST_SAVED_SLOT, null);
  await redis.set(WALLET_BALANCE, null);
  await redis.set(AR_SPENT, null);
  await redis.set(AR_SPENT_UNCONFIRMED, null);

  await fetchingTxsQueue.clean(0, 0);
  await fetchingTxsQueue.clean(0,0,  'wait');
  await fetchingTxsQueue.clean(0,0,  'active');
  await fetchingTxsQueue.clean(0,0,  'completed');
  await fetchingTxsQueue.clean(0,0,  'delayed');
  await fetchingTxsQueue.clean(0,0,  'failed');

  const pendingBlocksQueue = new Queue(PENDING_TXS_QUEUE);
  await pendingBlocksQueue.clean(0, 0);
  await pendingBlocksQueue.clean(0,0,  'wait');
  await pendingBlocksQueue.clean(0,0,  'active');
  await pendingBlocksQueue.clean(0,0,  'completed');
  await pendingBlocksQueue.clean(0,0,  'delayed');
  await pendingBlocksQueue.clean(0,0,  'failed');

  const postingTxsQueue = new Queue(POSTING_TXS_QUEUE);
  await postingTxsQueue.clean(0, 0);
  await postingTxsQueue.clean(0,0,  'wait');
  await postingTxsQueue.clean(0,0,  'active');
  await postingTxsQueue.clean(0,0,  'completed');
  await postingTxsQueue.clean(0,0,  'delayed');
  await postingTxsQueue.clean(0,0,  'failed');
};

const fetchSlots = async (first, last) => {
  console.log('Fetching confirmed blocks:');

  const fetchedSlots = [];
  let lastFetchedSlot = first;
  try {
    while (lastFetchedSlot - last < MAX_SLOT_CHUNK_SIZE) {
      const lastSlotToFetch = lastFetchedSlot + MAX_SLOT_CHUNK_SIZE;
      const { result: confirmedSlotsChunk } = await getConfirmedBlocks(lastFetchedSlot, lastSlotToFetch > last ? last : lastSlotToFetch);
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

export const start = async (options) => {
  await redisCleanupOnRestart();

  const start = new Date();
  console.log(start);

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

  const livestream = !options.lastSlot;
  const firstSlot = options.firstSlot || await getFirstSlot();
  const lastSlot = options.lastSlot || await getCurrentSlot();

  /**
  * Get all confirmed Solana slots
  */
  const confirmedSlots = await fetchSlots(firstSlot, lastSlot);

  await redis.set(LAST_SAVED_SLOT, confirmedSlots.slice(-1)[0]);

  const concurrency = options.concurrency || 1;

  const txFetchingWorker = new Worker(FETCHING_TXS_QUEUE, async (job: Job) => {
    const { data: slot } = job;
    try {
      const { result: confirmedBlock } = await getConfirmedBlock(slot);
      await saveBlockToArweave(confirmedBlock, slot);
      console.log(`Last fetched slot: ${slot}`);
    } catch (e) {
      throw Error(`Failed to proceed slot ${slot}: ${e.message}`);
    }
  }, {concurrency});

  txFetchingWorker.on('completed', async () => {
    const nextSlot = confirmedSlots.shift();
    if (!nextSlot) {
      if (!livestream) return;

      const first = await redis.get(LAST_SAVED_SLOT);
      const last = await getCurrentSlot();
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

  const length = confirmedSlots.length;
  for (let i = 0; i < (concurrency * 10) && i < length; ++i) {
    const slot = confirmedSlots.shift();
    await fetchingTxsQueue.add(`${slot}`, slot)
  }
};

const walletBalanceWorker = new Worker(WALLET_BALANCE, async () => {
  const balance = await arweaveAPI.getWalletBalance();
  await redis.set(WALLET_BALANCE, balance);
});
