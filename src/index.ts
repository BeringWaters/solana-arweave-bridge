import { Connection } from '@solana/web3.js'
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
import Arweave from 'arweave';

dotenv.config({ path: `.env` });

const arweaveOptions = {
  host: 'arweave.net',// Hostname or IP address for a Arweave host
  port: 443,          // Port
  protocol: 'https',  // Network protocol http or https
  timeout: 20000,     // Network request timeouts in milliseconds
  logging: false,     // Enable network request logging
}

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
  const arweave = Arweave.init(arweaveOptions);
  console.log("Blocks fetching started...")
  console.log({ SOLANA_NODE_URL: process.env.SOLANA_NODE_URL })

  const connection = new Connection(process.env.SOLANA_NODE_URL)

  let lastFetchedSlot = await connection.getSlot() // TODO persist last fetched block for correct restart

  while (true) {
    const nextSlot = await connection.getSlot()
    console.log({ lastFetchedSlot, nextSlot })

    try {
      const { result } = await getConfirmedBlocks(lastFetchedSlot + 1, nextSlot)
      const confirmedBlocks = await Promise.all(result.map((slot) => connection.getConfirmedBlock(slot)))
      confirmedBlocks.forEach(block => {
        console.log({ block }) // TODO put block in airweave
      })

      lastFetchedSlot = nextSlot
    } catch (e) {
      console.log(e.message)
    }
  }


}
