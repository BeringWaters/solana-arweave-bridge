/* eslint-disable no-console */
import { ConfirmedBlock } from '@solana/web3.js';
import { Job, Worker } from 'bullmq';
import solanaAPI from '../api/Solana.api';
import arweaveAPI from '../api/Arweave.api';

import { createBlockContainer, getNetworkAlias } from '../service/Arweave.BFA.service';
import {
  postingTxsQueue,
  fetchingTxsQueue,
  FETCHING_TXS_QUEUE,
} from '../service/Queue.service';
import { OPTIONS, SOLANA_OPTIONS } from '../config';
import { redis, SAVED_BLOCKS_SET } from '../service/Redis.service';

const isBlockExistInArweave = async (blockContainer, blockNumber, txIdentifier) => {
  for (let i = 0; i < blockContainer.length; i++) {
    if (OPTIONS.verify) {
      // eslint-disable-next-line no-await-in-loop
      const result = await arweaveAPI.searchContainer(blockContainer[i].tags);
      if (result.length > 0) {
        console.log(`Block ${blockNumber} is already stored in Arweave`);
        return true;
      }
    }
    // eslint-disable-next-line no-await-in-loop
    const processed = await redis.sismember(SAVED_BLOCKS_SET, txIdentifier);
    if (processed) {
      console.log(`Block ${blockNumber} is already stored in Arweave`);
      return true;
    }
  }
  return false;
};

// eslint-disable-next-line consistent-return
async function postBlockToArweave(solanaBlock: ConfirmedBlock, blockNumber: number) {
  console.log(`Processing block ${blockNumber}`);
  try {
    const blockContainer = await createBlockContainer(solanaBlock, blockNumber);
    const txIdentifier = `${blockNumber}_${OPTIONS.database}_${getNetworkAlias(SOLANA_OPTIONS.url)}`;
    if (await isBlockExistInArweave(blockContainer, blockNumber, txIdentifier)) {
      return;
    }

    await postingTxsQueue.add(txIdentifier, blockContainer);
  } catch (e) {
    console.log(`Error occurred while processing block ${blockNumber}: ${e}`);
    throw (e);
  }
}

export const txFetchingWorker = new Worker(FETCHING_TXS_QUEUE, async (job: Job) => {
  const { data: blockNumber } = job;
  try {
    const { result: confirmedBlock } = await solanaAPI.getConfirmedBlock(blockNumber);
    await postBlockToArweave(confirmedBlock, blockNumber);
  } catch (e) {
    throw Error(`Failed to process block ${blockNumber}: ${e.message}`);
  }
});

txFetchingWorker.on('completed', async (job: Job) => {
  const { data: blockNumber } = job;
  console.log(`Fetched block ${blockNumber} successfully`);
});

txFetchingWorker.on('failed', async (job: Job) => {
  const { data: blockNumber } = job;
  await fetchingTxsQueue.add(`${blockNumber}`, blockNumber);
});
