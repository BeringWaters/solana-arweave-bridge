/* eslint-disable no-console */
import { ConfirmedBlock } from '@solana/web3.js';
import { Job, Worker } from 'bullmq';
import solanaAPI from '../api/Solana.api';

import { createBlockContainer, getNetworkAlias } from '../service/Arweave.BFA.service';
import {
  postingTxsQueue,
  fetchingTxsQueue,
  FETCHING_TXS_QUEUE,
} from '../service/Queue.service';
import { OPTIONS, SOLANA_OPTIONS } from '../config';

// eslint-disable-next-line consistent-return
async function postBlockToArweave(solanaBlock: ConfirmedBlock, blockNumber: number) {
  console.log(`Processing block ${blockNumber}`);
  try {
    const blockContainer = await createBlockContainer(solanaBlock, blockNumber);
    const txIdentifier = `${blockNumber}_${OPTIONS.database}_${getNetworkAlias(SOLANA_OPTIONS.url)}`;

    return (await postingTxsQueue.add(txIdentifier, blockContainer));

    // TODO: check container existence
    // return await Promise.all(blockContainers.map(async (container) => {
    //   if (OPTIONS.verify) {
    //     const result = await arweaveAPI.searchContainer(container.tags);
    //     if (result.length > 0) return;
    //   }
    //   // container.txs = await compressData(container.txs);
    //
    //   const containerNumber = container.tags[BLOCK_TAGS.container.alias];
    //   const database = container.tags[BLOCK_TAGS.database.alias];
    //   const network = container.tags[BLOCK_TAGS.network.alias];
    //
    //   const txIdentifier = `${blockNumber}_${containerNumber}_${database}_${network}`;
    //   const processed = await redis.sismember(SAVED_BLOCKS_SET, txIdentifier);
    //   if (processed) {
    //     console.log(`Block ${blockNumber} (part ${containerNumber})
    //     is already stored in Arweave`);
    //     return;
    //   }
    //
    //   return (await postingTxsQueue.add(txIdentifier, container));
    // }));
  } catch (e) {
    console.log(`Error occurred while processing block ${blockNumber}: ${e}`);
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
