import {
  LAST_SAVED_BLOCK_KEY,
  PENDING_BLOCKS_QUEUE,
  saveBlockToArweave,
  SAVED_BLOCKS_QUEUE
} from './Arweave.worker';
import { Queue } from 'bullmq';
import { getConfirmedSlots, getConfirmedBlock, getCurrentSlot, getFirstSlot } from '../api/Solana.api';
import { MAX_SLOT_CHUNK_SIZE } from '../config';

import * as Redis from 'ioredis';
const redis = new Redis();

const redisCleanupOnRestart = async () => {
  await redis.set(LAST_SAVED_BLOCK_KEY, null); // FIXME need this value on restart
  const pendingBlocksQueue = new Queue(PENDING_BLOCKS_QUEUE);
  const savedBlocksQueue = new Queue(SAVED_BLOCKS_QUEUE);
  await pendingBlocksQueue.clean(1000, 1000);
  await savedBlocksQueue.clean(1000, 1000);
};

export const start = async () => {
  console.log('Arweave initialization...');
  console.log('Blocks fetching started...');

  await redisCleanupOnRestart();

  const { result: firstSlot } = await getFirstSlot(); // get from options
  const { result: lastSlot } = { result: firstSlot + 200 } || await getCurrentSlot(); // get from options

  const confirmedSlots = [];
  let lastFetchedSlot = firstSlot;

  try {
    while (lastFetchedSlot - lastSlot <= MAX_SLOT_CHUNK_SIZE) {
      const lastSlotToFetch = lastFetchedSlot + MAX_SLOT_CHUNK_SIZE;
      const { result: confirmedSlotsChunk } = await getConfirmedSlots(lastFetchedSlot, lastSlotToFetch > lastSlot ? lastSlot : lastSlotToFetch);
      confirmedSlots.push(...confirmedSlotsChunk);
      lastFetchedSlot = lastSlotToFetch;
    }
  } catch (e) {
    console.log(`Failed to get confirmed slots: ${e.message}`);
    return;
  }

  // add job that enlarges confirmedBlocks with getCurrentSlot() + getConfirmedBlocks() if lastBlock not in options

  for (const slot of confirmedSlots) {
    try {
      const { result: confirmedBlock } = await getConfirmedBlock(slot);
      await saveBlockToArweave(confirmedBlock, slot);
      console.log(`Last saved slot: ${slot}`); // TODO: save last saved slot
    } catch (e) {
      console.log(`Failed to proceed slot ${slot}: ${e.message}`);
    }
    console.log('\n');
  }
};
