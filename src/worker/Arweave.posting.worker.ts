import { Worker, Job } from 'bullmq';
import arweaveAPI from '../api/Arweave.api';
import {
  TX_STATUS_POLLING_DELAY,
  TX_STATUS_POLLING_ATTEMPTS,
} from '../config';
import { WINSTON_TO_AR, BLOCK_TAGS } from '../constants';
import {
  postingTxsQueue,
  pendingTxsQueue,
  POSTING_TXS_QUEUE,
  AR_SPENT_UNCONFIRMED,
  WALLET_BALANCE,
} from '../service/Queue.service';
import { redis } from '../service/Redis.service';

export const txPostingWorker = new Worker(POSTING_TXS_QUEUE, async (job: Job) => {
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
    await postingTxsQueue.add(`${container.tags[BLOCK_TAGS['slot'].alias]}_${container.tags[BLOCK_TAGS['container'].alias]}`, container);
    return;
  }

  await arweaveAPI.signTransaction(arweaveTx);
  await arweaveAPI.postTransaction(arweaveTx);

  await redis.set(AR_SPENT_UNCONFIRMED, arSpent + txPrice);

  await pendingTxsQueue.add(`${container.tags[BLOCK_TAGS['slot'].alias]}_${container.tags[BLOCK_TAGS['container'].alias]}`, {arweaveTx, container}, {
    delay: TX_STATUS_POLLING_DELAY,
    attempts: TX_STATUS_POLLING_ATTEMPTS,
    backoff: TX_STATUS_POLLING_DELAY,
    removeOnComplete: true,
    removeOnFail: true,
  });
  console.log(`Posted arweave tx: ${arweaveTx.id}. Data size: ${arweaveTx.data_size} bytes. Price: ${txPrice} winston (${txPrice / WINSTON_TO_AR} AR)`);
});
