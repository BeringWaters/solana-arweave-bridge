const Arweave = require('arweave');
import { PublicKey } from '@solana/web3.js';

import axios from 'axios';
import { ARWEAVE_OPTIONS } from '../config';

const arweave = Arweave.init(ARWEAVE_OPTIONS);
const wallet = require(`../../${ARWEAVE_OPTIONS.keyPath}`);

export const createTransaction = async (data) => {
  const arweaveTx = await arweave.createTransaction({ data }, wallet);
  return arweaveTx;
};

export const signTransaction = async (tx) => {
  return arweave.transactions.sign(tx, wallet);
};

export const postTransaction = async (tx, chunkUploading = true) => {
  if (chunkUploading) {
    const uploader = await arweave.transactions.getUploader(tx);

    while (!uploader.isComplete) {
      await uploader.uploadChunk();
      console.log(`tx: ${tx.id}: ${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`);
    }
  }
  return arweave.transactions.post(tx);
};

export const getTransactionPrice = async (byteSize: number) => {
  const price = await arweave.transactions.getPrice(byteSize);
  return price;
};

export const getWalletBalance = async () => {
  const balance = await arweave.wallets.getBalance(wallet);
  return balance;
};

export const getTransactionStatus = async (id) => {
  const txStatus = await arweave.transactions.getStatus(id);
  return txStatus;
};

export default {
  createTransaction,
  signTransaction,
  postTransaction,
  getTransactionPrice,
  getWalletBalance,
  getTransactionStatus
}
