import { ConfirmedTransactionMeta, Transaction } from '@solana/web3.js';

const getObjectValue = (path, obj) =>
  path.reduce((xs, x) =>
    (xs !== undefined && xs[x] !== undefined) ? xs[x] : null, obj);

const txProperties = [
  {
    path: ['message', 'header', 'numReadonlySignedAccounts'],
    name: 'numReadonlySignedAccounts',
    id: 'a',
  },
  {
    path: ['message', 'header', 'numReadonlyUnsignedAccounts'],
    name: 'numReadonlyUnsignedAccounts',
    id: 'b',
  },
  {
    path: ['message', 'header', 'numRequiredSignatures'],
    name: 'numRequiredSignatures',
    id: 'c',
  },
];

const txIterableProperties = [
  {
    path: ['signatures'],
    name: 'signature',
    id: 'd',
  },
  {
    path: ['message', 'accountKeys'],
    name: 'accountKey',
    id: 'e',
  },
  {
    path: ['message', 'instructions'],
    subPath: ['programIdIndex'],
    name: 'programIdIndex',
    id: 'f',
  },
];

export const addTagsToTxs = (transactions: {
  transaction: Transaction;
  meta: ConfirmedTransactionMeta | null;
}[]) => {
  return transactions.reduce((agg, { transaction }) => {
    const tags = {
      ...txProperties.reduce((agg, item) => {
        return {
          ...agg,
          [`${item.id}`]: [],
        }
      }, {}),
      ...txIterableProperties.reduce((agg, item) => {
        return {
          ...agg,
          [`${item.id}`]: [],
        }
      }, {}),
    };

    txProperties.forEach((property) => {
      const propertyValue = getObjectValue(property.path, transaction);
      if (propertyValue === null) return;
      tags[`${property.id}`].push(`${propertyValue}`);
    });

    txIterableProperties.forEach((property) => {
      const propertyArray = getObjectValue(property.path, transaction) || [];
      propertyArray.forEach((propertyArrayValue) => {
        const propertyValue = property.subPath ? getObjectValue(property.subPath, propertyArrayValue) : propertyArrayValue;
        if (propertyValue === null) return;
        tags[`${property.id}`].push(`${propertyValue}`);
      });
    });

    const bytes = Object.keys(tags).reduce((agg: number, val) => {
      tags[val].forEach((el) => {
        agg += el.length + 1;
      });
      return agg;
    }, 0);

    return [...agg, { tags, transaction, bytes }];
  }, []);
};
