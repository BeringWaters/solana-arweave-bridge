import { and, or, equals } from 'arql-ops';
import { ARWEAVE_OPTIONS } from '../config';

const Arweave = require('arweave');

export const arweave = Arweave.init(ARWEAVE_OPTIONS);

const wallet = {
  'key': undefined,
  'address': undefined,
};
(async () => {
  wallet.key = require(`../../${ARWEAVE_OPTIONS.keyPath}`);
  wallet.address = await arweave.wallets.jwkToAddress(wallet.key);
})();

export const createTransaction = async (data) => {
  const arweaveTx = await arweave.createTransaction(data, wallet.key);
  return arweaveTx;
};

export const signTransaction = async (tx) => {
  return arweave.transactions.sign(tx, wallet.key);
  return arweave.transactions.sign(tx, wallet.key);
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
  const balance = await arweave.wallets.getBalance(wallet.address);
  return balance;
};

export const getTransactionStatus = async (id) => {
  const txStatus = await arweave.transactions.getStatus(id);
  return txStatus;
};

export const getTransaction = async (id) => {
  const tx = await arweave.transactions.get(id);
  return tx;
};

export const getTransactionData = async (id) => {
  const txData = await arweave.transactions.getData(id);
  return txData;
};

export const searchContainer = async (parameters) => {
  const myQuery = and(
    equals('1', parameters['1']),
    equals('2', parameters['2']),
    equals('3', parameters['3']),
    equals('4', parameters['4']),
  );

  const results = await arweave.arql(myQuery);
  return results;
};

export default {
  createTransaction,
  signTransaction,
  postTransaction,
  getTransactionPrice,
  getWalletBalance,
  getTransactionStatus,
  getTransaction,
  getTransactionData,
  searchContainer,
}
