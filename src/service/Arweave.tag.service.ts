import { ConfirmedTransactionMeta, Transaction } from '@solana/web3.js';
import { TX_TAGS } from '../constants';

export const getObjectValue = (path, obj) =>
  path.reduce((xs, x) =>
    (xs !== undefined && xs[x] !== undefined) ? xs[x] : null, obj);

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
  const tagNames = Object.keys(TX_TAGS);
  return transactions.reduce((agg, { transaction }) => {
    const tags = {
      ...tagNames.reduce((agg, tag) => {
        return {
          ...agg,
          [`${TX_TAGS[tag].alias}`]: [],
        }
      }, {}),
    };

    tagNames.forEach((tagName) => {
      const tag = TX_TAGS[tagName];
      const tagValue = getObjectValue(tag.path, transaction);
      if (tagValue === null) return;
      if (!tag.iterable) {
        tags[`${tag.alias}`].push(`${tagValue}`);
        return;
      }
      tagValue.forEach((valueIterable) => {
        const value = tag.subPath ? getObjectValue(tag.subPath, valueIterable) : valueIterable;
        if (value === null) return;
        tags[`${tag.alias}`].push(`${value}`);
      });
    });

    const bytes = getTagsSize(tags);

    return [...agg, { tags, transaction, bytes }];
  }, []);
};
