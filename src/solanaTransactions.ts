import { ConfirmedBlock, Connection } from '@solana/web3.js'
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
import {
  LAST_SAVED_BLOCK_KEY,
  PENDING_BLOCKS_QUEUE,
  saveBlockToArweave,
  SAVED_BLOCKS_QUEUE
} from "./arweaveTransactions";
import { Queue } from "bullmq";


import * as Redis from 'ioredis';
const redis = new Redis();


dotenv.config({ path: `.env` });


const getConfirmedBlocks = async (fromSlot, toSlot) => {
  var raw = JSON.stringify({ "jsonrpc": "2.0", "id": 1, "method": "getConfirmedBlocks", "params": [fromSlot, toSlot] });

  var requestOptions = {
    method: 'POST',
    headers: { "Content-Type": "application/json" },
    body: raw,
  };

  return fetch(process.env.SOLANA_NODE_URL, requestOptions).then(response => response.json())

}


const redisCleanupOnRestart = async () => {
  await redis.set(LAST_SAVED_BLOCK_KEY, null); // FIXME need this value on restart
  const pendingBlocksQueue = new Queue(PENDING_BLOCKS_QUEUE);
  const savedBlocksQueue = new Queue(SAVED_BLOCKS_QUEUE);
  await pendingBlocksQueue.clean(1000, 1000)
  await savedBlocksQueue.clean(1000, 1000)
}

export async function start() {
  console.log("Arweave initialization...")
  console.log("Blocks fetching started...")
  console.log({ SOLANA_NODE_URL: process.env.SOLANA_NODE_URL })

  const connection = new Connection(process.env.SOLANA_NODE_URL)

  await redisCleanupOnRestart()

  let lastFetchedSlot = await connection.getSlot() // TODO persist last fetched block for correct restart

  while (true) {
    const nextSlot = await connection.getSlot()
    console.log({ lastFetchedSlot, nextSlot })

    try {
      const { result } = await getConfirmedBlocks(lastFetchedSlot + 1, nextSlot)
      console.log({result})
      const confirmedBlocks: {slot: number, confirmedBlock: ConfirmedBlock}[] = await Promise.all(result.map(async (slot) => {
        let confirmedBlock = await connection.getConfirmedBlock(slot);
        return {slot, confirmedBlock};
      }))
      for (const data of confirmedBlocks) {
        // FIXME process unconfirmed block as skipped to save lastSavedBlockCorrectly
        await saveBlockToArweave(data.confirmedBlock, data.slot);
      }

      lastFetchedSlot = nextSlot
    } catch (e) {
      console.log(e.message)
    }
  }


}
