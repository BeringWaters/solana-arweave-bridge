import { ConfirmedBlock, Connection } from '@solana/web3.js'
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
import { saveBlockToArweave } from "./arweaveTransactions";

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


export async function start() {
  console.log("Arweave initialization...")
  console.log("Blocks fetching started...")
  console.log({ SOLANA_NODE_URL: process.env.SOLANA_NODE_URL })

  const connection = new Connection(process.env.SOLANA_NODE_URL)

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
        await saveBlockToArweave(data.confirmedBlock, data.slot);
      }

      lastFetchedSlot = nextSlot
    } catch (e) {
      console.log(e.message)
    }
  }


}
