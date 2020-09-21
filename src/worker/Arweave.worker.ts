import { ConfirmedBlock, ConfirmedTransactionMeta, Transaction } from '@solana/web3.js';
import * as dotenv from 'dotenv';
import { Queue, Worker } from 'bullmq';
import { getTxsTags } from '../service/Arweave.tag.service';
import { getTransactionPrice } from '../api/Arweave.api';
import * as Redis from 'ioredis';
import { ARWEAVE_OPTIONS, ARWEAVE_ADDRESS, WINSTON_TO_AR } from '../config';

const redis = new Redis();

const Arweave = require('arweave');
import msgpack from 'msgpack-lite';

dotenv.config({ path: `.env` });

/* ************************** ARWEAVE SETTINGS ************************** */
const arweave = Arweave.init(ARWEAVE_OPTIONS);
const wallet = require(`../../${ARWEAVE_OPTIONS.keyPath}`);
/* ********************************************************************** */


export const PENDING_BLOCKS_QUEUE = 'PENDING_BLOCKS_QUEUE';
export const SAVED_BLOCKS_QUEUE = 'SAVED_BLOCKS_QUEUE';
export const LAST_SAVED_BLOCK_KEY = 'LAST_SAVED_BLOCK_KEY';

const pendingBlocksQueue = new Queue(PENDING_BLOCKS_QUEUE);
const savedBlocksQueue = new Queue(SAVED_BLOCKS_QUEUE);

const compressTxData = (transactions) => {
  return msgpack.encode(transactions);
};

export async function saveBlockToArweave(solanaBlock: ConfirmedBlock, slotNumber: number) {
  console.log(`Save slot ${slotNumber} to arweave`);
  const { blockhash, parentSlot, transactions } = solanaBlock;
  const txsData = compressTxData(transactions);
  const arweaveTx = await arweave.createTransaction(
    {
      target: ARWEAVE_ADDRESS,
      data: txsData,
    },
    wallet
  );
  // tx tagging
  arweaveTx.addTag('network', 'testnet'); // TODO: get from options
  arweaveTx.addTag('blockhash', blockhash);
  arweaveTx.addTag('parentSlot', parentSlot);
  arweaveTx.addTag('slot', slotNumber);

  const txsTags = getTxsTags(transactions);
  txsTags.forEach((tag) => {
    arweaveTx.addTag(tag, true);
  });

  const { data: txPrice } = await getTransactionPrice(arweaveTx.data_size);
  console.log(`Created arweave tx. Data size: ${arweaveTx.data_size} bytes. Price: ${txPrice} winston (${txPrice / WINSTON_TO_AR} AR)`);

  // await arweave.transactions.sign(arweaveTx, wallet);

  // console.log(arweaveTx.id)
  // const result = await await arweave.transactions.post(arweaveTx)

  // await pendingBlocksQueue.add(slotNumber.toString(), {arweaveTx, parentSlot: solanaBlock.parentSlot })
}


async function checkArweaveTxStatus(job) {
  const txData = job.data;
  const { id } = txData;
  // test
  return Math.random() > 0.8;
}

const blockStatusPollingWorker = new Worker(PENDING_BLOCKS_QUEUE, async (job) => {
  console.log({ checkStatus: job.name });
  const hasSuccessStatus = await checkArweaveTxStatus(job)
  if (hasSuccessStatus) {
    await savedBlocksQueue.add(job.name, job.data)
  } else {
    await pendingBlocksQueue.add(job.name, job.data)
  }
});


const savedBlockWorker = new Worker(SAVED_BLOCKS_QUEUE, async (job) => { // FIXME THIS WORKER WORKS NOT CORRECT. NEED TO DEBUG...
  const lastSavedBlock = await redis.get(LAST_SAVED_BLOCK_KEY);
  const savedBlock = job.name;
  const { parentSlot } = job.data;
  console.log({ savedBlock, lastSavedBlock, parentSlot });
  let jobs = await savedBlocksQueue.getJobs(['waiting', 'active' ]);
  console.log({jobs: jobs.map(job => job.name)});
  if(Number.parseInt(lastSavedBlock) >  Number.parseInt(savedBlock)) {
    return
  }
  if (!lastSavedBlock) {
    await redis.set(LAST_SAVED_BLOCK_KEY, savedBlock);
  } else if (Number.parseInt(lastSavedBlock) === parentSlot) {
    await redis.set(LAST_SAVED_BLOCK_KEY, savedBlock);
    console.log({ LAST_SAVED_BLOCK_KEY: savedBlock });
  } else {
    await savedBlocksQueue.add(job.name, job.data, {lifo: true});
  }
});
