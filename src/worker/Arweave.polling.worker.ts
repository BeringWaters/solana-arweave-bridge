import { Job, Worker } from 'bullmq';

import arweaveAPI from '../api/Arweave.api';
import { TX_NUMBER_OF_CONFIRMATIONS } from '../config';
import {
	PENDING_TXS_QUEUE,
	postingTxsQueue,
} from '../service/Queue.service';
import {
  redis,
  AR_SPENT,
  AR_SPENT_UNCONFIRMED,
  SAVED_BLOCKS_SET,
} from '../service/Redis.service';

// eslint-disable-next-line consistent-return
export const txStatusPollingWorker = new Worker(PENDING_TXS_QUEUE, async (job: Job) => {
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
  await redis.sadd(SAVED_BLOCKS_SET, name);
  console.log(`Tx ${arweaveTx.id} succeed.`);
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
    console.log(`Tx ${arweaveTx.id} failed but re-added to queue.`);
  }
});
