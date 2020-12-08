import { getTransactionData, GraphQL } from '../api/Arweave.api';
import { getObjectValue } from './Arweave.tag.service';
import { BLOCK_TAGS, TX_TAGS } from '../constants';

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

    const query = `query {
        transactions(
            first: 100,
            tags: [
                { name: "${alias}", values: ["${value}"] }
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

    const transactions = await GraphQL(query);

    if (transactions.length === 0) {
      return [];
    }

    const txArrays: Array<any> = await Promise.all(transactions.map(async (tx) => {
      const data = await getTransactionData(tx.node.id);
      const decoded = await (new TextDecoder('utf-8').decode(data));
      return JSON.parse(decoded);
    }));

    const solanaTxs = txArrays.reduce((txs: Array<any>, txArray: any) => [...txs, ...txArray], []);

    if (blockTagsNames.includes(name) || !txTagsNames.includes(name)) {
      return solanaTxs;
    }

    const txTag = TX_TAGS[name];

    return solanaTxs.filter((tx: any) => {
      const txValue = getObjectValue(txTag.path, tx);
      return txValue === value;
    });
  },
};
