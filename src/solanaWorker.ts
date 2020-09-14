import { Worker } from 'bullmq'
import { ConfirmedBlock, ConfirmedTransactionMeta, Connection, Transaction } from '@solana/web3.js'
import fetch from 'node-fetch';
import { putTxsToBuffer, getTxsFromBuffer } from './txBufferService';

const getConfirmedBlocks = async (fromSlot, toSlot) => {
  const raw = JSON.stringify({ "jsonrpc": "2.0", "id": 1, "method": "getConfirmedBlocks", "params": [fromSlot, toSlot] });

  const requestOptions = {
    method: 'POST',
    headers: { "Content-Type": "application/json" },
    body: raw,
  };

  return fetch(process.env.SOLANA_NODE_URL, requestOptions).then(response => response.json())

};

const getConfirmedBlock = async (slot, solanaNodeUrl) => {
  const raw = JSON.stringify({ "jsonrpc": "2.0", "id": 1, "method": "getConfirmedBlock", "params": [slot] });

  const requestOptions = {
    method: 'POST',
    headers: { "Content-Type": "application/json" },
    body: raw,
  };

  return fetch(solanaNodeUrl, requestOptions).then(response => response.json())

};

const getNextSlot = async () => {
  // get next slot from storage
};

const worker = new Worker('Solana', async (job) => {
  const { solanaNodeUrl } = job;
  const nextSlot = getNextSlot();

  try {
    const { result } = await getConfirmedBlock(nextSlot, solanaNodeUrl);
    const { blockhash, transactions } = result;
    await putTxsToBuffer(blockhash, transactions)
  } catch (e) {
    console.log(e.message)
  }
};
