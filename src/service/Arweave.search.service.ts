import { and, or, equals } from 'arql-ops';
import { arweave } from './Arweave.service';
import { getTransaction, getTransactionData } from '../api/Arweave.api';
import { decompressData } from './Arweave.compression.service';
import { getTagAlias, getObjectValue, txTags, txIterableTags } from './Arweave.tag.service';

export const searchByParameter = async (name, value) => {
  const txTag = txTags.find((tagObj) => tagObj.name === name);
  if (!txTag) {
    throw new Error('Search parameter not found')
  }

  const myQuery = and(
    equals(getTagAlias(name), value),
  );

  const txIds = await arweave.arql(myQuery);

  const txArrays: Array<any> = await Promise.all(txIds.map(async (txId) => {
    const data = await getTransactionData(txId);
    // const data = tx.data || await getTransactionData(txId);
    const txArray = await decompressData(data);
    return txArray;
  }));

  const solanaTxs = txArrays.reduce((txs: Array<any>, txArray: any) => {
    return [...txs, ...txArray];
  }, []);

  const txsFound = solanaTxs.filter((tx: any) => {
    const txValue = getObjectValue(txTag.path, tx);
    return txValue === value;
  });

  return txsFound;
};

export const searchByIterableParameter = async (name, value) => {
  let txTag = txIterableTags.find((tagObj) => tagObj.name === name);
  if (!txTag) {
    throw new Error('Search parameter not found')
  }

  const myQuery = and(
    equals(getTagAlias(name), value),
  );

  const txIds = await arweave.arql(myQuery);

  const txArrays: Array<any> = await Promise.all(txIds.map(async (txId) => {
    const data = await getTransactionData(txId);
    // const data = tx.data || await getTransactionData(txId);
    const txArray = await decompressData(data);
    return txArray;
  }));

  const solanaTxs = txArrays.reduce((txs: Array<any>, txArray: any) => {
    return [...txs, ...txArray];
  }, []);

  const txsFound = solanaTxs.filter((tx: any) => {
    const txValue = getObjectValue(txTag.path, tx);
    return txValue.includes(value);
  });

  return txsFound;
};
