import { ConfirmedBlock } from '@solana/web3.js';
import { Queue, QueueScheduler, Worker, Job } from 'bullmq';
import * as Redis from 'ioredis';
import * as msgpack from 'msgpack-lite';
import {
  WINSTON_TO_AR,
  TX_STATUS_POLLING_DELAY,
  MAX_TAGS_SIZE,
  TX_STATUS_POLLING_ATTEMPTS,
  TX_NUMBER_OF_CONFIRMATIONS,
  MAX_RESPONSE_ATTEMPTS
} from '../config';
import { addTagsToTxs } from '../service/Arweave.tag.service';
import arweaveAPI from '../api/Arweave.api';

const redis = new Redis();

export const POSTING_TXS_QUEUE = 'POSTING_TXS_QUEUE';
export const PENDING_TXS_QUEUE = 'PENDING_TXS_QUEUE';
export const SAVED_TXS_QUEUE = 'SAVED_TXS_QUEUE';
export const LAST_SAVED_BLOCK_KEY = 'LAST_SAVED_BLOCK_KEY';

const postingTxsQueue = new Queue(POSTING_TXS_QUEUE,{
  defaultJobOptions: {
    removeOnComplete: true,
  },
});
const pendingTxsQueue = new Queue(PENDING_TXS_QUEUE);
const pendingTxsQueueScheduler = new QueueScheduler(PENDING_TXS_QUEUE);
const savedTxsQueue = new Queue(SAVED_TXS_QUEUE);

const compressTxsData = (transactions) => {
  return msgpack.encode(transactions);
};

const signAndPostTransaction = async (tx) => {
  await arweaveAPI.signTransaction(tx);
  // await arweaveAPI.postTransaction(tx);
};

const addTagsToContainer = (containerTags, txTags) => {
  const tags = containerTags;
  Object.keys(txTags).forEach((tagKey) => {
    tags[tagKey] = tags[tagKey] ? [...new Set([...tags[tagKey], ...txTags[tagKey]])] : txTags[tagKey];
  });
  return tags;
};

const getTagsSize = (tags) => {
  let bytes = 0;
  Object.keys(tags).forEach((tag) => {
    const value = tags[tag];
    if (Array.isArray(value)) {
      value.forEach((v) => {
        bytes += v.length + 1;
      })
    } else {
      bytes += value.length + 1;
    }
  });
  return bytes;
};

const createContainer = (blockhash, slotNumber, containerNumber) => {
  const tags = {
    '1': slotNumber,
    '2': blockhash,
    '3': containerNumber,
  };

  return {
    txs: [],
    tags,
    spaceLeft: MAX_TAGS_SIZE - getTagsSize(tags),
  }
};

const findBFContainerIndex = (containers, bytes) => {
  let containerIndex = undefined;
  containers.forEach((container, index) => {
    if (container.spaceLeft >= bytes
      && (!containerIndex || containers[containerIndex].spaceLeft > container.spaceLeft)) {
      containerIndex = index;
    }
  });
  return containerIndex;
};

export async function saveBlockToArweave(solanaBlock: ConfirmedBlock, slotNumber: number) {
  console.log(`Process Solana slot ${slotNumber}`);
  const { blockhash, transactions: solanaTxs } = solanaBlock;
  let containerNumber = 0;
  /**
   * BF ALLOCATION ALGORITHM
   */
  const taggedTxs = addTagsToTxs(solanaTxs);
  const txContainers = taggedTxs.reduce((txContainers, taggedTx) => {
    const { tags, transaction, bytes} = taggedTx;
    let txContainerIndex = findBFContainerIndex(txContainers, bytes);
    if (!txContainerIndex) {
      txContainerIndex = (txContainers.push(createContainer(blockhash, slotNumber, containerNumber++)) - 1);
    }
    txContainers[txContainerIndex].txs.push(transaction);
    txContainers[txContainerIndex].tags = addTagsToContainer(txContainers[txContainerIndex].tags, tags);
    txContainers[txContainerIndex].spaceLeft -= bytes;
  }, [createContainer(blockhash, slotNumber, containerNumber++)]);

  await Promise.all(txContainers.forEach(async (container) => {
    container.txs = await compressTxsData(container.txs);
    await postingTxsQueue.add(`${container.tags['1']}_${container.tags['2']}`, container);
  }))
}

const txPostingWorker = new Worker(POSTING_TXS_QUEUE, async (job: Job) => {
  const { data: container } = job;
  const { txs, tags } = container;
  const arweaveTx = await arweaveAPI.createTransaction({data: txs});
  Object.keys(tags).forEach((tagKey) => {
    const values = tags[tagKey];
    values.forEach((value => arweaveTx.addTag(tagKey, value)));
  });

  const txPrice = await arweaveAPI.getTransactionPrice(arweaveTx.data_size);
  const balance = await arweaveAPI.getWalletBalance();

  if (balance < txPrice) {
    console.log(`Wallet balance is not sufficient to process arweave transaction ${arweaveTx.id}.\n
    Data size: ${arweaveTx.data_size} bytes. Price: ${txPrice} winston (${txPrice / WINSTON_TO_AR} AR)`);
    await postingTxsQueue.add(`${container.tags['1']}_${container.tags['2']}`, container);
    return;
  }

  await signAndPostTransaction(arweaveTx);
  await pendingTxsQueue.add(`${container.tags['1']}_${container.tags['2']}`, {arweaveTx, container}, {
    delay: TX_STATUS_POLLING_DELAY,
    attempts: MAX_RESPONSE_ATTEMPTS,
  });
  console.log(`Created arweave tx: ${arweaveTx.id}. Data size: ${arweaveTx.data_size} bytes. Price: ${txPrice} winston (${txPrice / WINSTON_TO_AR} AR)`);
});

const txStatusPollingWorker = new Worker(PENDING_TXS_QUEUE, async (job: Job) => {
  const { data } = job;
  const { arweaveTx } = data;
  console.log(`Check arweave transaction status: ${arweaveTx.id}`);
  const { confirmed } = await arweaveAPI.getTransactionStatus(arweaveTx.id);

  if (!confirmed) {
    throw new Error(`Error occurred while posting transaction ${arweaveTx.id} to Arweave`);
  }

  if (confirmed.number_of_confirmations < TX_NUMBER_OF_CONFIRMATIONS) {
    throw new Error(`Insufficient number of confirmations for transaction ${arweaveTx.id}`);
  }
});

txStatusPollingWorker.on('completed', async (job: Job) => {
  const { data } = job;
  const { arweaveTx, container } = data;
  await savedTxsQueue.add(`${container.tags['1']}_${container.tags['2']}`, arweaveTx);
});

txStatusPollingWorker.on('failed', async (job: Job) => {
  const { data } = job;
  const { arweaveTx, container } = data;
  await postingTxsQueue.add(`${container.tags['1']}_${container.tags['2']}`, arweaveTx);
});

const savedBlockWorker = new Worker(SAVED_TXS_QUEUE, async (job) => { // FIXME THIS WORKER WORKS NOT CORRECT. NEED TO DEBUG...
  // const lastSavedBlock = await redis.get(LAST_SAVED_BLOCK_KEY);
  // const savedBlock = job.name;
  // const { parentSlot } = job.data;
  // console.log({ savedBlock, lastSavedBlock, parentSlot });
  // let jobs = await savedBlocksQueue.getJobs(['waiting', 'active' ]);
  // console.log({jobs: jobs.map(job => job.name)});
  // if(Number.parseInt(lastSavedBlock) >  Number.parseInt(savedBlock)) {
  //   return
  // }
  // if (!lastSavedBlock) {
  //   await redis.set(LAST_SAVED_BLOCK_KEY, savedBlock);
  // } else if (Number.parseInt(lastSavedBlock) === parentSlot) {
  //   await redis.set(LAST_SAVED_BLOCK_KEY, savedBlock);
  //   console.log({ LAST_SAVED_BLOCK_KEY: savedBlock });
  // } else {
  //   await savedBlocksQueue.add(job.name, job.data, {lifo: true});
  // }
});
