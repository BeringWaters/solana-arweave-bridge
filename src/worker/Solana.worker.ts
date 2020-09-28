import {
  LAST_SAVED_BLOCK_KEY,
  PENDING_TXS_QUEUE,
  saveBlockToArweave,
  SAVED_TXS_QUEUE
} from './Arweave.worker';
import {Job, Queue, Worker} from 'bullmq';
import { getConfirmedBlocks, getConfirmedBlock, getCurrentSlot, getFirstSlot } from '../api/Solana.api';
import {MAX_SLOT_CHUNK_SIZE, TX_NUMBER_OF_CONFIRMATIONS} from '../config';

import * as Redis from 'ioredis';
import arweaveAPI from "../api/Arweave.api";
const redis = new Redis();

export const FETCHING_TXS_QUEUE = 'FETCHING_TXS_QUEUE';
const fetchingTxsQueue = new Queue(FETCHING_TXS_QUEUE);

const redisCleanupOnRestart = async () => {
  await redis.set(LAST_SAVED_BLOCK_KEY, null); // FIXME need this value on restart
  const pendingBlocksQueue = new Queue(PENDING_TXS_QUEUE);
  const savedBlocksQueue = new Queue(SAVED_TXS_QUEUE);
  await pendingBlocksQueue.clean(1000, 1000);
  await savedBlocksQueue.clean(1000, 1000);
};

export const start = async (options = {
  firstSlot: 36568072,
  lastSlot: undefined,
  concurrency: 8,
}) => {
  const start = new Date();
  console.log(start);

  console.log('Arweave initialization...');
  console.log('Blocks fetching started...');

  await redisCleanupOnRestart();

  const firstSlot = options.firstSlot || await getFirstSlot();
  const lastSlot = options.lastSlot || await getCurrentSlot();

  /**
  * Get all confirmed Solana slots
  */
  const confirmedSlots = [];
  let lastFetchedSlot = firstSlot;

  console.log(`Fetching confirmed blocks:\n
  ${0}/${lastSlot - firstSlot}\n`);

  try {
    while (lastFetchedSlot - lastSlot <= MAX_SLOT_CHUNK_SIZE) {
      const lastSlotToFetch = lastFetchedSlot + MAX_SLOT_CHUNK_SIZE;
      const { result: confirmedSlotsChunk } = await getConfirmedBlocks(lastFetchedSlot, lastSlotToFetch > lastSlot ? lastSlot : lastSlotToFetch);
      confirmedSlots.push(...confirmedSlotsChunk);
      lastFetchedSlot = lastSlotToFetch;
      console.log(`${lastFetchedSlot - firstSlot}/${lastSlot - firstSlot}\n`)
    }
  } catch (e) {
    console.log(`Failed to get confirmed slots: ${e.message}`);
    return;
  }

  // TODO: add job that enlarges confirmedBlocks with getCurrentSlot() + getConfirmedBlocks() if lastBlock not in options

  confirmedSlots.forEach(async (slot) => {
    await fetchingTxsQueue.add(`${slot}`, slot)
  })
};

const txFetchingWorker = new Worker(FETCHING_TXS_QUEUE, async (job: Job) => {
  const { data: slot } = job;
  try {
    const { result: confirmedBlock } = await getConfirmedBlock(slot);
    await saveBlockToArweave(confirmedBlock, slot);
    console.log(`Last fetched slot: ${slot}`);
  } catch (e) {
    throw Error(`Failed to proceed slot ${slot}: ${e.message}`);
  }
});

txFetchingWorker.on('failed', async (job: Job) => {
  const { data: slot } = job;
  await fetchingTxsQueue.add(`${slot}`, slot);
});
