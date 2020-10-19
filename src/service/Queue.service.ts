import { Queue, QueueScheduler } from 'bullmq';
import { REDIS_OPTIONS } from '../config';

export const FETCHING_TXS_QUEUE = 'FETCHING_TXS_QUEUE';
export const FETCHING_BALANCE_QUEUE = 'FETCHING_BALANCE_QUEUE';
export const POSTING_TXS_QUEUE = 'POSTING_TXS_QUEUE';
export const PENDING_TXS_QUEUE = 'PENDING_TXS_QUEUE';

export let fetchingTxsQueue;
export let postingTxsQueue;
export let pendingTxsQueue;
export let pendingTxsQueueScheduler;
export let fetchingBalanceQueue;

export const initializeQueueService = async () => {
	const connection = REDIS_OPTIONS;
	fetchingTxsQueue = new Queue(FETCHING_TXS_QUEUE, { connection, defaultJobOptions: { timeout: 60000 } } );
	fetchingBalanceQueue = new Queue(FETCHING_BALANCE_QUEUE, { connection, defaultJobOptions: { timeout: 60000 } } );
	postingTxsQueue = new Queue(POSTING_TXS_QUEUE,{ connection, defaultJobOptions: { removeOnComplete: true } } );
	pendingTxsQueue = new Queue(PENDING_TXS_QUEUE, { connection });
	pendingTxsQueueScheduler = new QueueScheduler(PENDING_TXS_QUEUE, { connection });
};

export const queueCleanup = async () => {
	await fetchingTxsQueue.clean(0,0,  'wait');
	await fetchingTxsQueue.clean(0,0,  'active');
	await fetchingTxsQueue.clean(0,0,  'delayed');

	await postingTxsQueue.clean(0,0,  'wait');
	await postingTxsQueue.clean(0,0,  'active');
	await postingTxsQueue.clean(0,0,  'delayed');
};
