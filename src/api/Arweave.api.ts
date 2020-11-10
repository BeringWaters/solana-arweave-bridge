/* eslint-disable no-console */
import axios from 'axios';
import { arweave, wallet } from '../service/Arweave.service';
import { ARWEAVE_GRAPHQL, BLOCK_TAGS } from '../constants';

export async function GraphQL(query: string) {
  const { data } = await axios
    .post(ARWEAVE_GRAPHQL, { query });

  return data.data.transactions.edges;
}

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
  const query = `query {
        transactions(
            first: 100,
            tags: [
                { name: "${BLOCK_TAGS.block.alias}", values: ["${parameters[BLOCK_TAGS.block.alias]}"] },
                { name: "${BLOCK_TAGS.slot.alias}", values: ["${parameters[BLOCK_TAGS.slot.alias]}"] },
                { name: "${BLOCK_TAGS.container.alias}", values: ["${parameters[BLOCK_TAGS.container.alias]}"] },
                { name: "${BLOCK_TAGS.blockhash.alias}", values: ["${parameters[BLOCK_TAGS.blockhash.alias]}"] },
                { name: "${BLOCK_TAGS.network.alias}", values: ["${parameters[BLOCK_TAGS.network.alias]}"] },
                { name: "${BLOCK_TAGS.database.alias}", values: ["${parameters[BLOCK_TAGS.database.alias]}"] }
            ]
        ) {
            edges {
                cursor
                node {
                    id
                    tags {
                        name
                        value
                    }
                }
            }
        }
    }`;

  return GraphQL(query);
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
