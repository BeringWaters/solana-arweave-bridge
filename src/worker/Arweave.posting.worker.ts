/* eslint-disable no-console */
import { Worker, Job } from 'bullmq';
import deepHash from 'arweave/node/lib/deepHash';
import ArweaveBundles from 'arweave-bundles';
import arweaveAPI from '../api/Arweave.api';
import {
  TX_STATUS_POLLING_DELAY,
  TX_STATUS_POLLING_ATTEMPTS,
} from '../config';
import { WINSTON_TO_AR } from '../constants';
import { arweave, wallet } from '../service/Arweave.service';
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

export const NONCE = '170A240D55E8D4A96647180DEE407C28D5388DF5653895859B4C76B6D5D99DD7';
export const txPostingWorker = new Worker(POSTING_TXS_QUEUE, async (job: Job) => {
  const deps = {
    utils: arweave.utils,
    crypto: arweave.crypto,
    deepHash,
  };

  const arBundles = ArweaveBundles(deps);

  const { data: transactions } = job;

  const createBundle = async (transaction) => {
    const data = JSON.stringify(transaction);
    const bundle = await arBundles.createData({
      data,
      nonce: NONCE,
      target: wallet.address,
    }, wallet.key);

    Object.keys(transaction.tags).forEach((tagKey) => {
      const tagValue = transaction.tags[tagKey];
      if (Array.isArray(tagValue)) {
        tagValue.forEach(((value) => arBundles.addTag(bundle, tagKey, value)));
        return;
      }
      arBundles.addTag(bundle, tagKey, tagValue);
    });

    return arBundles.sign(bundle, wallet.key);
  };

  let bundles = [];
  for (let i = 0; i < transactions.length; i++) {
    // eslint-disable-next-line no-await-in-loop
    const bundledItem = await createBundle(transactions[i]);
    bundles = bundles.concat(bundledItem);
  }
  const data = await arBundles.bundleData(bundles);

  const arweaveTx = await arweaveAPI.createTransaction({ data: JSON.stringify(data) });

  arweaveTx.addTag('Bundle-Type', 'ANS-102');
  arweaveTx.addTag('Bundle-Format', 'json');
  arweaveTx.addTag('Bundle-Version', '1.0.0');
  arweaveTx.addTag('Content-Type', 'application/json');

  const arSpent = parseInt(await redis.get(AR_SPENT_UNCONFIRMED) || '0', 10);
  const balance = parseInt(await redis.get(WALLET_BALANCE) || '0', 10);
  const txPrice = parseInt(await arweaveAPI.getTransactionPrice(arweaveTx.data_size), 10);

  if (balance < txPrice + arSpent) {
    console.log(`Wallet balance is not sufficient to process Arweave transaction ${arweaveTx.id}.\n
    Data size: ${arweaveTx.data_size} bytes. Price: ${txPrice} winston (${txPrice / WINSTON_TO_AR} AR)\n
    Balance: ${balance}`);
    await postingTxsQueue.add(job.name, transactions);
    return;
  }

  await arweaveAPI.signTransaction(arweaveTx);
  await arweaveAPI.postTransaction(arweaveTx);

  await redis.set(AR_SPENT_UNCONFIRMED, arSpent + txPrice);
  await pendingTxsQueue.add(
    job.name,
    {
      wallet: wallet.address,
      remove: false,
      arweaveTx,
      transactions,
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
