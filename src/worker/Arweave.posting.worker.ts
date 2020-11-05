/* eslint-disable no-console */
import { Worker, Job } from 'bullmq';
import arweaveAPI from '../api/Arweave.api';
import {
  TX_STATUS_POLLING_DELAY,
  TX_STATUS_POLLING_ATTEMPTS,
} from '../config';
import { WINSTON_TO_AR, BLOCK_TAGS } from '../constants';
import { wallet } from '../service/Arweave.service';
import {
  postingTxsQueue,
  pendingTxsQueue,
  POSTING_TXS_QUEUE,
} from '../service/Queue.service';
import {
  redis,
  AR_SPENT_UNCONFIRMED,
  WALLET_BALANCE,
} from '../service/Redis.service';

export const txPostingWorker = new Worker(POSTING_TXS_QUEUE, async (job: Job) => {
  const { data: container } = job;
  const { txs, tags } = container;

  const blockNumber = container.tags[BLOCK_TAGS.block.alias];
  const containerNumber = container.tags[BLOCK_TAGS.container.alias];
  const database = container.tags[BLOCK_TAGS.database.alias];
  const network = container.tags[BLOCK_TAGS.network.alias];

  const arweaveTx = await arweaveAPI.createTransaction({ data: txs });

  Object.keys(tags).forEach((tagKey) => {
    const tagValue = tags[tagKey];
    if (Array.isArray(tagValue)) {
      tagValue.forEach(((value) => arweaveTx.addTag(tagKey, value)));
      return;
    }
    arweaveTx.addTag(tagKey, tagValue);
  });

  const arSpent = parseInt(await redis.get(AR_SPENT_UNCONFIRMED) || '0', 10);
  const balance = parseInt(await redis.get(WALLET_BALANCE) || '0', 10);
  const txPrice = parseInt(await arweaveAPI.getTransactionPrice(arweaveTx.data_size), 10);

  if (balance < txPrice + arSpent) {
    console.log(`Wallet balance is not sufficient to process Arweave transaction ${arweaveTx.id}.\n
    Data size: ${arweaveTx.data_size} bytes. Price: ${txPrice} winston (${txPrice / WINSTON_TO_AR} AR)\n
    Balance: ${balance}`);
    await postingTxsQueue.add(`${blockNumber}_${containerNumber}_${database}_${network}`, container);
    return;
  }

  await arweaveAPI.signTransaction(arweaveTx);
  await arweaveAPI.postTransaction(arweaveTx);

  await redis.set(AR_SPENT_UNCONFIRMED, arSpent + txPrice);

  await pendingTxsQueue.add(
    `${blockNumber}_${containerNumber}_${database}_${network}`,
    {
      wallet: wallet.address,
      remove: false,
      arweaveTx,
      container,
    },
    {
      delay: TX_STATUS_POLLING_DELAY,
      attempts: TX_STATUS_POLLING_ATTEMPTS,
      backoff: TX_STATUS_POLLING_DELAY,
      removeOnComplete: true,
      removeOnFail: true,
    },
  );
  console.log(`Posted arweave tx: ${arweaveTx.id}. Data size: ${arweaveTx.data_size} bytes. Price: ${txPrice} winston (${txPrice / WINSTON_TO_AR} AR)`);
});
