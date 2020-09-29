import { ConfirmedBlock } from '@solana/web3.js';
import { Queue, QueueScheduler, Worker, Job } from 'bullmq';
import * as Redis from 'ioredis';
import {
  WINSTON_TO_AR,
  TX_STATUS_POLLING_DELAY,
  MAX_TAGS_SIZE,
  TX_STATUS_POLLING_ATTEMPTS,
  TX_NUMBER_OF_CONFIRMATIONS,
} from '../config';
import { addTagsToTxs } from '../service/Arweave.tag.service';
import { compressData } from '../service/Arweave.compression.service';
import arweaveAPI from '../api/Arweave.api';

const redis = new Redis();

export const POSTING_TXS_QUEUE = 'POSTING_TXS_QUEUE';
export const PENDING_TXS_QUEUE = 'PENDING_TXS_QUEUE';
export const SAVED_TXS_QUEUE = 'SAVED_TXS_QUEUE';
export const LAST_SAVED_SLOT = 'LAST_SAVED_SLOT';
export const WALLET_BALANCE = 'WALLET_BALANCE';
export const AR_SPENT = 'AR_SPENT';
export const AR_SPENT_UNCONFIRMED = 'AR_SPENT_UNCONFIRMED';

const postingTxsQueue = new Queue(POSTING_TXS_QUEUE,{
  defaultJobOptions: {
    removeOnComplete: true,
  },
});
const pendingTxsQueue = new Queue(PENDING_TXS_QUEUE);
const pendingTxsQueueScheduler = new QueueScheduler(PENDING_TXS_QUEUE);
const savedTxsQueue = new Queue(SAVED_TXS_QUEUE);

const signAndPostTransaction = async (tx) => {
  await arweaveAPI.signTransaction(tx);
  await arweaveAPI.postTransaction(tx);
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
    '1': `${slotNumber}`,
    '2': `${containerNumber}`,
    '3': `${blockhash}`,
    '4': 'testnet'
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
  try {
    const txContainers = taggedTxs.reduce((txContainers, taggedTx) => {
      const { tags, transaction, bytes} = taggedTx;
      let txContainerIndex = findBFContainerIndex(txContainers, bytes);
      if (txContainerIndex === undefined) {
        txContainerIndex = (txContainers.push(createContainer(blockhash, slotNumber, containerNumber++)) - 1);
      }
      txContainers[txContainerIndex].txs.push(transaction);
      txContainers[txContainerIndex].tags = addTagsToContainer(txContainers[txContainerIndex].tags, tags);
      txContainers[txContainerIndex].spaceLeft -= bytes;
      return txContainers;
    }, [createContainer(blockhash, slotNumber, containerNumber++)]);

    await Promise.all(txContainers.map(async (container) => {
      const result = await arweaveAPI.searchContainer(container.tags);
      if (result.length > 0) return;
      container.txs = await compressData(container.txs);

      return (await postingTxsQueue.add(`${container.tags['1']}_${container.tags['2']}`, container));
    }))
  } catch (e) {
    console.log(`Error occurred while processing slot ${slotNumber}: ${e}`);
    return;
  }
}

const txPostingWorker = new Worker(POSTING_TXS_QUEUE, async (job: Job) => {
  const { data: container } = job;
  const { txs, tags } = container;
  const arweaveTx = await arweaveAPI.createTransaction({data: txs});
  Object.keys(tags).forEach((tagKey) => {
    const tagValue = tags[tagKey];
    if (Array.isArray(tagValue)) {
      tagValue.forEach((value => arweaveTx.addTag(tagKey, value)));
      return;
    }
    arweaveTx.addTag(tagKey, tagValue)
  });

  const arSpent = parseInt(await redis.get(AR_SPENT_UNCONFIRMED) || '0', 10);
  const balance = parseInt(await redis.get(WALLET_BALANCE) || '0', 10);
  const txPrice = parseInt(await arweaveAPI.getTransactionPrice(arweaveTx.data_size), 10);

  if (balance < txPrice + arSpent) {
    console.log(`Wallet balance is not sufficient to process arweave transaction ${arweaveTx.id}.\n
    Data size: ${arweaveTx.data_size} bytes. Price: ${txPrice} winston (${txPrice / WINSTON_TO_AR} AR)\n
    Balance: ${balance}`);
    await postingTxsQueue.add(`${container.tags['1']}_${container.tags['2']}`, container);
    return;
  }

  await signAndPostTransaction(arweaveTx);
  await redis.set(AR_SPENT_UNCONFIRMED, arSpent + txPrice);

  await pendingTxsQueue.add(`${container.tags['1']}_${container.tags['2']}`, {arweaveTx, container}, {
    delay: TX_STATUS_POLLING_DELAY,
    attempts: TX_STATUS_POLLING_ATTEMPTS,
    backoff: TX_STATUS_POLLING_DELAY,
    removeOnComplete: true,
    removeOnFail: true,
  });
  console.log(`Posted arweave tx: ${arweaveTx.id}. Data size: ${arweaveTx.data_size} bytes. Price: ${txPrice} winston (${txPrice / WINSTON_TO_AR} AR)`);
}, {concurrency: 8});

const txStatusPollingWorker = new Worker(PENDING_TXS_QUEUE, async (job: Job) => {
  const { data } = job;
  const { arweaveTx } = data;
  console.log(`Check arweave transaction status: ${arweaveTx.id}. Attempt: ${job.attemptsMade}`);
  const { confirmed, status } = await arweaveAPI.getTransactionStatus(arweaveTx.id);

  if (!confirmed) {
    if (status < 200 || status >= 300) {
      job.data.remove = true;
      job.attemptsMade = job.opts.attempts;
      throw new Error(`Error occurred while posting transaction ${arweaveTx.id} to Arweave`);
    }
    return Promise.reject(`Waiting for transaction ${arweaveTx.id} to be accepted`);
  }

  if (confirmed.number_of_confirmations < TX_NUMBER_OF_CONFIRMATIONS) {
    return Promise.reject(`Insufficient number of confirmations for transaction ${arweaveTx.id}`);
  }
});

txStatusPollingWorker.on('completed', async (job: Job) => {
  const { data, name } = job;
  const { arweaveTx } = data;

  const arSpent = await redis.get(AR_SPENT) || '0';
  await redis.set(AR_SPENT, parseInt(arSpent, 10) + parseInt(arweaveTx.reward, 10));

  await savedTxsQueue.add(`${name}`, arweaveTx);
  console.log(`Tx ${arweaveTx.id} succeed.`)
});

txStatusPollingWorker.on('failed', async (job: Job) => {
  const { data, name } = job;
  const { arweaveTx, container, remove } = data;

  if (job.attemptsMade >= job.opts.attempts) {
    const arSpent = await redis.get(AR_SPENT_UNCONFIRMED) || '0';
    await redis.set(AR_SPENT_UNCONFIRMED, parseInt(arSpent, 10) - parseInt(arweaveTx.reward, 10));
    if (remove) {
      console.log(`Tx ${arweaveTx.id} failed and removed from queue.`);
      return;
    }
    await postingTxsQueue.add(`${name}`, container);
    console.log(`Tx ${arweaveTx.id} failed but re-added to queue.`)
    return;
  }
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
