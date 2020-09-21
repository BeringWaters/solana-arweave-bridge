import { ConfirmedTransactionMeta, Transaction } from '@solana/web3.js';

const getObjectValue = (path, obj) =>
  path.reduce((xs, x) =>
    (xs !== undefined && xs[x] !== undefined) ? xs[x] : null, obj);

const txProperties = [
  {
    path: ['message', 'header', 'numReadonlySignedAccounts'],
    name: 'numReadonlySignedAccounts'
  },
  {
    path: ['message', 'header', 'numReadonlyUnsignedAccounts'],
    name: 'numReadonlyUnsignedAccounts'
  },
  {
    path: ['message', 'header', 'numRequiredSignatures'],
    name: 'numRequiredSignatures'
  },
];

const txIterableProperties = [
  {
    path: ['signatures'],
    name: 'signature'
  },
  {
    path: ['message', 'accountKeys'],
    name: 'accountKey'
  },
  {
    path: ['message', 'instructions'],
    subPath: ['programIdIndex'],
    name: 'programIdIndex'
  },
];

export const getTxsTags = (transactions: {
  transaction: Transaction;
  meta: ConfirmedTransactionMeta | null;
}[]) => {
  const tagsList = transactions.reduce((agg: String[], { transaction }) => {
    txProperties.forEach((property) => {
      const propertyValue = getObjectValue(property.path, transaction);
      if (propertyValue === null) return;
      agg.push(`${property.name}_${propertyValue}`);
    });

    txIterableProperties.forEach((property) => {
      const propertyArray = getObjectValue(property.path, transaction) || [];
      propertyArray.forEach((propertyArrayValue) => {
        const propertyValue = property.subPath ? getObjectValue(property.subPath, propertyArrayValue) : propertyArrayValue;
        if (propertyValue === null) return;
        agg.push(`${property.name}_${propertyValue}`);
      });
    });

    return agg;
  }, []);

  return [...new Set(tagsList)];
};
