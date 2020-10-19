import { equals } from 'arql-ops';
import { arweave } from './Arweave.service';
import { getTransactionData } from '../api/Arweave.api';
import { decompressData } from './Arweave.compression.service';
import { getObjectValue } from './Arweave.tag.service';
import { TX_TAGS, BLOCK_TAGS } from '../constants';

const txTagsNames = Object.keys(TX_TAGS);
const blockTagsNames = Object.keys(BLOCK_TAGS);

const getTagAlias = (name) => {
  if (txTagsNames.includes(name)) {
    return TX_TAGS[name].alias;
  }
  if (blockTagsNames.includes(name)) {
    return BLOCK_TAGS[name].alias;
  }
  return name;
};

export default {
  searchByTag: async (name, value) => {
    const alias = getTagAlias(name);
    const query = equals(alias, value);

    const txIds = await arweave.arql(query);

    if (txIds.length === 0) {
      return [];
    }

    const txArrays: Array<any> = await Promise.all(txIds.map(async (txId) => {
      const data = await getTransactionData(txId);
      const txArray = await decompressData(data);
      return txArray;
    }));

    const solanaTxs = txArrays.reduce((txs: Array<any>, txArray: any) => {
      return [...txs, ...txArray];
    }, []);

    if (blockTagsNames.includes(name) || !txTagsNames.includes(name)) {
      return solanaTxs;
    }

    const txTag = TX_TAGS[name];

    const txsFound = solanaTxs.filter((tx: any) => {
      const txValue = getObjectValue(txTag.path, tx);
      return txValue === value;
    });

    return txsFound;
  }
};
