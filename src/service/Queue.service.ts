import { Queue, QueueScheduler } from 'bullmq';

export const FETCHING_TXS_QUEUE = 'FETCHING_TXS_QUEUE';
export const POSTING_TXS_QUEUE = 'POSTING_TXS_QUEUE';
export const PENDING_TXS_QUEUE = 'PENDING_TXS_QUEUE';
export const SAVED_TXS_QUEUE = 'SAVED_TXS_QUEUE';
export const WALLET_BALANCE = 'WALLET_BALANCE';

export const AR_SPENT = 'AR_SPENT';
export const AR_SPENT_UNCONFIRMED = 'AR_SPENT_UNCONFIRMED';
export const LAST_SAVED_SLOT = 'LAST_SAVED_SLOT';

export const fetchingTxsQueue = new Queue(FETCHING_TXS_QUEUE, { defaultJobOptions: { timeout: 60000 } });
export const postingTxsQueue = new Queue(POSTING_TXS_QUEUE,{defaultJobOptions: { removeOnComplete: true } });
export const pendingTxsQueue = new Queue(PENDING_TXS_QUEUE);
export const pendingTxsQueueScheduler = new QueueScheduler(PENDING_TXS_QUEUE);
export const savedTxsQueue = new Queue(SAVED_TXS_QUEUE);
export const walletBalanceQueue = new Queue(WALLET_BALANCE, { defaultJobOptions: { timeout: 60000 } });
