/* eslint-disable no-console */
import { and, equals } from 'arql-ops';
import { arweave, wallet } from '../service/Arweave.service';
import { BLOCK_TAGS } from '../constants';

export const createTransaction = async (data) => arweave.createTransaction(data, wallet.key);

export const signTransaction = async (tx) => arweave.transactions.sign(tx, wallet.key);

export const postTransaction = async (tx, chunkUploading = true) => {
  if (chunkUploading) {
    const uploader = await arweave.transactions.getUploader(tx);

    while (!uploader.isComplete) {
      // eslint-disable-next-line no-await-in-loop
      await uploader.uploadChunk();
    }
  }
  return arweave.transactions.post(tx);
};

export const getTransactionPrice = (byteSize: number) => arweave.transactions.getPrice(byteSize);

export const getWalletBalance = async () => arweave.wallets.getBalance(wallet.address);

export const getTransactionStatus = async (id) => arweave.transactions.getStatus(id);

export const getTransaction = async (id) => {
  try {
    return arweave.transactions.get(id);
  } catch (e) {
    console.log(`error: ${e}`);
    return {};
  }
};

export const getTransactionData = async (id) => arweave.transactions.getData(id, { decode: true });

export const searchContainer = async (parameters) => {
  const myQuery = and(
    equals(BLOCK_TAGS['block'].alias, parameters[BLOCK_TAGS['block'].alias]),
    equals(BLOCK_TAGS['slot'].alias, parameters[BLOCK_TAGS['slot'].alias]),
    equals(BLOCK_TAGS['container'].alias, parameters[BLOCK_TAGS['container'].alias]),
    equals(BLOCK_TAGS['blockhash'].alias, parameters[BLOCK_TAGS['blockhash'].alias]),
    equals(BLOCK_TAGS['network'].alias, parameters[BLOCK_TAGS['network'].alias]),
    equals(BLOCK_TAGS['database'].alias, parameters[BLOCK_TAGS['database'].alias]),
  );

  return arweave.arql(myQuery);
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
};
