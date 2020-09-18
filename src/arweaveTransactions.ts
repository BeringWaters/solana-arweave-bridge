import { ConfirmedBlock } from "@solana/web3.js";
import * as dotenv from "dotenv";
import { Queue, Worker } from "bullmq";

import * as Redis from 'ioredis';

const redis = new Redis();


const Arweave = require('arweave');
import moment = require("moment");
var msgpack = require('msgpack-lite');


dotenv.config({ path: `.env` });

/* ************************** ARWEAVE SETTINGS ************************** */
// TODO do we need to put this config to .env?
const ARWEAVE_OPTIONS = {
  host: 'arweave.net',// Hostname or IP address for a Arweave host
  port: 443,          // Port
  protocol: 'https',  // Network protocol http or https
  timeout: 20000,     // Network request timeouts in milliseconds
  logging: false,     // Enable network request logging
}
const ARWEAVE_ADDRESS = 'QkbQ9Cq7x6I7Jnmw5mePKDSEVavTMvABBPMJY6nGZLY'
const arweave = Arweave.init(ARWEAVE_OPTIONS);
const wallet = require(`../${process.env.KEY_PATH}`)
/* ********************************************************************** */


export const PENDING_BLOCKS_QUEUE = 'PENDING_BLOCKS_QUEUE'
export const SAVED_BLOCKS_QUEUE = 'SAVED_BLOCKS_QUEUE'

export const LAST_SAVED_BLOCK_KEY = 'LAST_SAVED_BLOCK_KEY'

const pendingBlocksQueue = new Queue(PENDING_BLOCKS_QUEUE);
const savedBlocksQueue = new Queue(SAVED_BLOCKS_QUEUE);


export async function saveBlockToArweave(solanaBlock: ConfirmedBlock, slotNumber: number) {
  const encodedData = msgpack.encode(solanaBlock);

  const arweaveTx = await arweave.createTransaction({
      target: ARWEAVE_ADDRESS,
      data: encodedData,
    },
    wallet
  )
  arweaveTx.addTag('Test-Tag', 'test tag')

  // console.log({ arweaveTx })
  await arweave.transactions.sign(arweaveTx, wallet)
  console.log(arweaveTx.id)
  // const result = await await arweave.transactions.post(arweaveTx)

  await pendingBlocksQueue.add(slotNumber.toString(), {arweaveTx, parentSlot: solanaBlock.parentSlot })
}


async function checkArweaveTxStatus(job) {
  const txData = job.data;
  const { id } = txData;
  // ONLY FOR TEST MOVE TO THE SAVED TXS QUEUE IN RANDOM WAY
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
})


const savedBlockWorker = new Worker(SAVED_BLOCKS_QUEUE, async (job) => { // FIXME THIS WORKER WORKS NOT CORRECT. NEED TO DEBUG...
  const lastSavedBlock = await redis.get(LAST_SAVED_BLOCK_KEY);
  const savedBlock = job.name
  const {parentSlot} = job.data
  console.log({ savedBlock, lastSavedBlock, parentSlot });
  let jobs = await savedBlocksQueue.getJobs(['waiting', 'active' ]);
  console.log({jobs: jobs.map(job => job.name)})
  if(Number.parseInt(lastSavedBlock) >  Number.parseInt(savedBlock)) {
    return
  }
  if (!lastSavedBlock) {
    await redis.set(LAST_SAVED_BLOCK_KEY, savedBlock);
  } else if (Number.parseInt(lastSavedBlock) === parentSlot) {
    await redis.set(LAST_SAVED_BLOCK_KEY, savedBlock);
    console.log({ LAST_SAVED_BLOCK_KEY: savedBlock })
  } else {
    await savedBlocksQueue.add(job.name, job.data, {lifo: true})
  }
})
