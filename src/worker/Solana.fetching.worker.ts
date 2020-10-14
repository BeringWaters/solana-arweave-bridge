import { ConfirmedBlock } from '@solana/web3.js';
import {Job, Worker} from 'bullmq';
import solanaAPI from '../api/Solana.api';
import arweaveAPI from '../api/Arweave.api';
import { createContainers } from '../service/Arweave.BFA.service';
import { compressData } from '../service/Arweave.compression.service';
import {
  postingTxsQueue,
  FETCHING_TXS_QUEUE,
} from '../service/Queue.service';
import { BLOCK_TAGS } from '../constants';
import { OPTIONS } from '../config';

async function postBlockToArweave(solanaBlock: ConfirmedBlock, slotNumber: number) {
  console.log(`Process Solana slot ${slotNumber}`);
  try {
    const txContainers = await createContainers(solanaBlock, slotNumber);
    await Promise.all(txContainers.map(async (container) => {
      if (OPTIONS.verify) {
        const result = await arweaveAPI.searchContainer(container.tags);
        if (result.length > 0) return;
      }
      container.txs = await compressData(container.txs);

      return (await postingTxsQueue.add(`${container.tags[BLOCK_TAGS['slot'].alias]}_${container.tags[BLOCK_TAGS['container'].alias]}`, container));
    }));
  } catch (e) {
    console.log(`Error occurred while processing slot ${slotNumber}: ${e}`);
    return;
  }
}

export const txFetchingWorker = new Worker(FETCHING_TXS_QUEUE, async (job: Job) => {
  const { data: slot } = job;
  try {
    const { result: confirmedBlock } = await solanaAPI.getConfirmedBlock(slot);
    await postBlockToArweave(confirmedBlock, slot);
    console.log(`Last proceeded slot: ${slot}`);
  } catch (e) {
    throw Error(`Failed to proceed slot ${slot}: ${e.message}`);
  }
});
