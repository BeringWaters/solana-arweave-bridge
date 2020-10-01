import { and, or, equals } from 'arql-ops';
import { arweave, wallet } from '../service/Arweave.service';
import { getTagAlias } from '../service/Arweave.tag.service';

export const createTransaction = async (data) => {
  const arweaveTx = await arweave.createTransaction(data, wallet.key);
  return arweaveTx;
};

export const signTransaction = async (tx) => {
  return arweave.transactions.sign(tx, wallet.key);
};

export const postTransaction = async (tx, chunkUploading = true) => {
  if (chunkUploading) {
    const uploader = await arweave.transactions.getUploader(tx);

    while (!uploader.isComplete) {
      await uploader.uploadChunk();
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
  try {
    const tx = await arweave.transactions.get(id);
    return tx;
  } catch (e) {
    console.log(`error: ${e}`);
    return {};
  }
};

export const getTransactionData = async (id) => {
  const txData = await arweave.transactions.getData(id, {decode: true});
  return txData;
};

export const searchContainer = async (parameters) => {
  const myQuery = and(
    equals(getTagAlias('slot'), parameters[getTagAlias('slot')]),
    equals(getTagAlias('container'), parameters[getTagAlias('container')]),
    equals(getTagAlias('blockhash'), parameters[getTagAlias('blockhash')]),
    equals(getTagAlias('network'), parameters[getTagAlias('network')]),
    equals(getTagAlias('database'), parameters[getTagAlias('database')]),
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
