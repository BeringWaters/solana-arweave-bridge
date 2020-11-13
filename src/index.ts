/* eslint-disable no-await-in-loop,import/no-named-as-default-member,no-console */
import solanaAPI from './api/Solana.api';
import {
  OPTIONS,
  SLOTS_PER_THREAD,
  WALLET_BALANCE_POLLING_TIMEOUT,
  LIVESTREAM_POLLING_TIMEOUT,
} from './config';
import { initializeArweaveService, wallet } from './service/Arweave.service';
import {
  redis,
  initializeRedisService,
  redisCleanup,
  AR_SPENT,
  AR_SPENT_UNCONFIRMED,
  NEXT_START_SLOT,
  LAST_FETCHED_SLOT,
} from './service/Redis.service';
import {
  initializeQueueService,
  queueCleanup,
  fetchingTxsQueue,
  fetchingBalanceQueue,
  pendingTxsQueue,
  FETCHING_BALANCE_QUEUE, postingTxsQueue,
} from './service/Queue.service';
import searchService from './service/Arweave.search.service';
import { txFetchingWorker } from './worker/Solana.fetching.worker';
import { txPostingWorker } from './worker/Arweave.posting.worker';
import { txStatusPollingWorker } from './worker/Arweave.polling.worker';
import { walletBalanceWorker } from './worker/WalletBalance.worker';
import { WINSTON_TO_AR } from './constants';

export const stream = async (firstslot, lastslot) => {
  const fetchSlots = async () => {
    const confirmedBlocks = [];
    const maxSlotChunkSize = SLOTS_PER_THREAD * OPTIONS.concurrency;

    const start = parseInt(await redis.get(NEXT_START_SLOT), 10);
    if (start > lastslot) {
      return;
    }

    const end = start + maxSlotChunkSize > lastslot ? lastslot : start + maxSlotChunkSize;
    try {
      const { result: confirmedBlocksChunk } = await solanaAPI.getConfirmedBlocks(start, end);
      confirmedBlocks.push(...confirmedBlocksChunk);
    } catch (err) {
      throw new Error(`Failed to fetch confirmed Solana blocks ids: ${err}`);
    }

    confirmedBlocks.map(async (block) => {
      await fetchingTxsQueue.add(`${block}`, block);
    });

    await redis.set(NEXT_START_SLOT, end + 1);
  };

  console.log(`Solana -> Arweave stream started ${new Date()}`);

  /**
   * Bridge services initialization
   */
  try {
    await initializeArweaveService();
  } catch (err) {
    throw new Error(`Failed to initialize Arweave Service: ${err}`);
  }

  try {
    await initializeRedisService();
    await redisCleanup();
  } catch (err) {
    throw new Error(`Failed to initialize Redis Service: ${err}`);
  }

  try {
    await initializeQueueService();
    await queueCleanup();
  } catch (err) {
    throw new Error(`Failed to initialize Queue Service: ${err}`);
  }

  txFetchingWorker.opts.concurrency = OPTIONS.concurrency;
  txPostingWorker.opts.concurrency = OPTIONS.concurrency;
  txStatusPollingWorker.opts.concurrency = OPTIONS.concurrency;
  walletBalanceWorker.opts.concurrency = 1;

  /**
   * Fetching wallet balance
   */
  await fetchingBalanceQueue.add(FETCHING_BALANCE_QUEUE);
  await fetchingBalanceQueue.add(FETCHING_BALANCE_QUEUE, {}, {
    repeat: {
      every: WALLET_BALANCE_POLLING_TIMEOUT,
    },
  });

  /**
   * Get and store unconfirmed transactions total price
   */
  const postingJobs = await pendingTxsQueue.getJobs(['active', 'wait', 'delayed']);
  const arSpentUnconfirmed = postingJobs.reduce((agg, job) => {
    const { data } = job;
    const { arweaveTx, wallet: txWallet } = data;
    if (txWallet !== wallet.address) {
      return agg;
    }
    return agg + parseInt(arweaveTx.reward, 10);
  }, 0);
  await redis.set(AR_SPENT_UNCONFIRMED, arSpentUnconfirmed);

  /**
   * Fetching confirmed Solana blocks ids
   */
  await redis.set(NEXT_START_SLOT, firstslot);

  const jobCount = await postingTxsQueue.getJobCounts('active', 'waiting', 'delayed');
  if ((jobCount.waiting + jobCount.active + jobCount.delayed) === 0) {
    await fetchSlots();
  }

  txFetchingWorker.on('drained', async () => {
    const postingQueueJobCount = await postingTxsQueue.getJobCounts('active', 'waiting', 'delayed');
    if ((postingQueueJobCount.waiting
        + postingQueueJobCount.active
        + postingQueueJobCount.delayed
    ) > 0) {
      return;
    }
    await fetchSlots();
  });

  txPostingWorker.on('drained', async () => {
    await fetchSlots();
  });

  txStatusPollingWorker.on('drained', async () => {
    const pendingQueueJobCount = await pendingTxsQueue.getJobCounts('active', 'waiting', 'delayed');
    if ((pendingQueueJobCount.waiting
        + pendingQueueJobCount.active
        + pendingQueueJobCount.delayed
    ) > 0) {
      return;
    }

    const start = parseInt(await redis.get(NEXT_START_SLOT), 10);
    if (start > lastslot) {
      const fetchingQueueJobCount = await fetchingTxsQueue.getJobCounts('active', 'waiting', 'delayed');
      if ((fetchingQueueJobCount.waiting
          + fetchingQueueJobCount.active
          + fetchingQueueJobCount.delayed
      ) > 0) {
        return;
      }

      const postingQueueJobCount = await postingTxsQueue.getJobCounts('active', 'waiting', 'delayed');
      if ((postingQueueJobCount.waiting
          + postingQueueJobCount.active
          + postingQueueJobCount.delayed
      ) > 0) {
        return;
      }

      const arSpent = await redis.get(AR_SPENT) || 0;
      console.log(`Solana slots ${firstslot}-${lastslot} were successfully transferred to Arweave`);
      console.log(`Total spent: ${arSpent} winston (${arSpent / WINSTON_TO_AR} AR)\n`);

      process.exit(0);
    }
  });
};

export const livestream = async () => {
  const fetchSlots = async () => {
    const confirmedBlocks = [];

    const currentSlot = parseInt(await solanaAPI.getCurrentSlot(), 10);
    const lastFetchedSlot = parseInt(await redis.get(LAST_FETCHED_SLOT), 10);

    if (lastFetchedSlot && currentSlot <= lastFetchedSlot) {
      return;
    }

    const start = lastFetchedSlot ? lastFetchedSlot + 1 : currentSlot;
    const end = currentSlot;

    try {
      const { result: confirmedBlocksChunk } = await solanaAPI.getConfirmedBlocks(start, end);
      confirmedBlocks.push(...confirmedBlocksChunk);
    } catch (err) {
      throw new Error(`Failed to fetch confirmed Solana blocks ids: ${err}`);
    }

    confirmedBlocks.map(async (block) => {
      await fetchingTxsQueue.add(`${block}`, block);
    });

    await redis.set(LAST_FETCHED_SLOT, end);
  };

  console.log(`Solana -> Arweave livestream started ${new Date()}`);

  /**
   * Bridge services initialization
   */
  try {
    await initializeArweaveService();
  } catch (err) {
    throw new Error(`Failed to initialize Arweave Service: ${err}`);
  }

  try {
    await initializeRedisService();
    await redisCleanup();
  } catch (err) {
    throw new Error(`Failed to initialize Redis Service: ${err}`);
  }

  try {
    await initializeQueueService();
    await queueCleanup();
  } catch (err) {
    throw new Error(`Failed to initialize Queue Service: ${err}`);
  }

  txFetchingWorker.opts.concurrency = OPTIONS.concurrency;
  txPostingWorker.opts.concurrency = OPTIONS.concurrency;
  txStatusPollingWorker.opts.concurrency = OPTIONS.concurrency;
  walletBalanceWorker.opts.concurrency = 1;

  /**
   * Fetching wallet balance
   */
  await fetchingBalanceQueue.add(FETCHING_BALANCE_QUEUE);
  await fetchingBalanceQueue.add(FETCHING_BALANCE_QUEUE, {}, {
    repeat: {
      every: WALLET_BALANCE_POLLING_TIMEOUT,
    },
  });

  /**
   * Get and store unconfirmed transactions total price
   */
  const postingJobs = await pendingTxsQueue.getJobs(['active', 'wait', 'delayed']);
  const arSpentUnconfirmed = postingJobs.reduce((agg, job) => {
    const { data } = job;
    const { arweaveTx, wallet: txWallet } = data;
    if (txWallet !== wallet.address) {
      return agg;
    }
    return agg + parseInt(arweaveTx.reward, 10);
  }, 0);
  await redis.set(AR_SPENT_UNCONFIRMED, arSpentUnconfirmed);

  /**
   * Livestream Solana slots to Arweave
   */
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await fetchSlots();
    await (new Promise((resolve) => {
      setTimeout(resolve, LIVESTREAM_POLLING_TIMEOUT);
    }));
  }
};

export const search = async (tagname, tagvalue) => {
  /**
   * Arweave service initialization
   */
  try {
    await initializeArweaveService();
  } catch (err) {
    throw new Error(`Failed to initialize Arweave Service: ${err}`);
  }
  return searchService.searchByTag(tagname, tagvalue);
};
