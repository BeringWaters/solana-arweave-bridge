import { and, or, equals } from 'arql-ops';
import { arweave, getTransaction, getTransactionData } from '../api/Arweave.api';
import { decompressData } from './Arweave.compression.service';

export const searchBySlotNumber = async (parameters) => {
  const myQuery = and(
    equals('1', parameters['1']),
  );

  const txIds = await arweave.arql(myQuery);

  const txs = await Promise.all(txIds.map(async (txId) => {
    const tx = await getTransaction(txId);
    const data = tx.data || await getTransactionData(txId);
    tx.data = await decompressData(data);
    return tx;
  }));

  return txs;
};
