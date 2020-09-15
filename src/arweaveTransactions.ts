import { ConfirmedBlock } from "@solana/web3.js";
import * as dotenv from "dotenv";
import { Queue, Worker } from "bullmq";

const Arweave = require('arweave');
import moment = require("moment");

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

const LAST_SAVED_BLOCK_KEY = 'LAST_SAVED_BLOCK_KEY'

const pendingBlocksQueue = new Queue(PENDING_BLOCKS_QUEUE);
const savedBlocksQueue = new Queue(SAVED_BLOCKS_QUEUE);


export async function saveBlockToArweave(solanaBlock: ConfirmedBlock, slotNumber: number) {
  console.log({ saveSlot: slotNumber })

  const arweaveTx = await arweave.createTransaction(
    {
      target: ARWEAVE_ADDRESS,
      data: `Test string: ${moment.now()}`,
      // quantity: tokens
    },
    wallet
  )
  arweaveTx.addTag('Test-Tag', 'test tag')

  // console.log({ arweaveTx })
  await arweave.transactions.sign(arweaveTx, wallet)
  console.log(arweaveTx.id)
  // const result = await await arweave.transactions.post(arweaveTx)

  await pendingBlocksQueue.add(slotNumber.toString(), arweaveTx)
}


async function checkArweaveTxStatus(job) {
  const txData = job.data;
  const { id } = txData;
  // ONLY FOR TEST MOVE TO THE SAVED TXS QUEUE IF IT WAS 1 SECOND IN THIS QUEUE
  const jobTimestamp = job.timestamp
  const currentTime = new Date().getTime()
  if (currentTime > jobTimestamp + 1000) {
    return true
  }
  return false
}

const blockStatusPollingWorker = new Worker(PENDING_BLOCKS_QUEUE, async (job) => {
  console.log({ checkStatus: job.name });
  const hasSuccessStatus = await checkArweaveTxStatus(job)
  if(hasSuccessStatus) {
    await savedBlocksQueue.add(job.name, job.data)
  } else {
    await pendingBlocksQueue.add(job.name, job.data)
  }
})


const savedBlockWorker = new Worker(SAVED_BLOCKS_QUEUE, async (job) => {
  console.log({ savedBlock: job.name });
})
