import { ConfirmedTransactionMeta, Transaction } from '@solana/web3.js';
import { TAG_ALIAS, NETWORK_ALIAS } from '../constants';

export const getObjectValue = (path, obj) =>
  path.reduce((xs, x) =>
    (xs !== undefined && xs[x] !== undefined) ? xs[x] : null, obj);

export const txTags = [
  {
    path: ['message', 'header', 'numReadonlySignedAccounts'],
    name: 'numReadonlySignedAccounts',
  },
  {
    path: ['message', 'header', 'numReadonlyUnsignedAccounts'],
    name: 'numReadonlyUnsignedAccounts',
  },
  {
    path: ['message', 'header', 'numRequiredSignatures'],
    name: 'numRequiredSignatures',
  },
];

export const txIterableTags = [
  {
    path: ['signatures'],
    name: 'signature',
  },
  {
    path: ['message', 'accountKeys'],
    name: 'accountKey',
  },
  {
    path: ['message', 'instructions'],
    subPath: ['programIdIndex'],
    name: 'programIdIndex',
  },
];

export const getTagAlias = (tagName) => {
  return TAG_ALIAS[tagName] || tagName;
};

export const getNetworkAlias = (networkUrl) => {
  return NETWORK_ALIAS[networkUrl] || networkUrl;
};

export const getTagsSize = (tags) => {
  return Object.keys(tags).reduce((tagBytes: number, tag) => {
    const tagValue = tags[tag];
    if (Array.isArray(tagValue)) {
      return tagValue.reduce((bytes: number, value) => {
        return bytes + value.length + 1;
      }, tagBytes)
    }
    return tagBytes + tagValue.length + 1;
  }, 0);
};

export const addTagsToTxs = (transactions: {
  transaction: Transaction;
  meta: ConfirmedTransactionMeta | null;
}[]) => {
  return transactions.reduce((agg, { transaction }) => {
    const tags = {
      ...txTags.reduce((agg, tag) => {
        return {
          ...agg,
          [`${getTagAlias(tag.name)}`]: [],
        }
      }, {}),
      ...txIterableTags.reduce((agg, tag) => {
        return {
          ...agg,
          [`${getTagAlias(tag.name)}`]: [],
        }
      }, {}),
    };

    txTags.forEach((tag) => {
      const value = getObjectValue(tag.path, transaction);
      if (value === null) return;
      tags[`${getTagAlias(tag.name)}`].push(`${value}`);
    });

    txIterableTags.forEach((tag) => {
      const valuesIterable = getObjectValue(tag.path, transaction) || [];
      valuesIterable.forEach((valueIterable) => {
        const value = tag.subPath ? getObjectValue(tag.subPath, valueIterable) : valueIterable;
        if (value === null) return;
        tags[`${getTagAlias(tag.name)}`].push(`${value}`);
      });
    });

    const bytes = getTagsSize(tags);

    return [...agg, { tags, transaction, bytes }];
  }, []);
};
