import { MAX_TAGS_SIZE } from '../constants';
import { addTagsToTxs, getTagsSize, getTagAlias, getNetworkAlias } from './Arweave.tag.service';
import { SOLANA_OPTIONS, OPTIONS } from '../config';

/**
 * Best Fit Algorithm Service
 */

const createContainer = (blockhash, slotNumber, containerNumber) => {
  const tags = {
    [`${getTagAlias('slot')}`]: `${slotNumber}`,
    [`${getTagAlias('container')}`]: `${containerNumber}`,
    [`${getTagAlias('blockhash')}`]: `${blockhash}`,
    [`${getTagAlias('network')}`]: `${getNetworkAlias(SOLANA_OPTIONS.url)}`,
    [`${getTagAlias('database')}`]: `${OPTIONS.database}`,
  };

  return {
    txs: [],
    tags,
    spaceLeft: MAX_TAGS_SIZE - getTagsSize(tags),
  }
};

const addTagsToContainer = (containerTags = {}, txTags = {}) => {
  return Object.keys(txTags).reduce((tags, tagKey) => {
    tags[tagKey] = tags[tagKey] ? [...new Set([...tags[tagKey], ...txTags[tagKey]])] : txTags[tagKey];
    return tags;
  }, containerTags);
};

const findBFContainerIndex = (containers, bytes) => {
  let containerIndex = undefined;
  containers.forEach((container, index) => {
    if (container.spaceLeft >= bytes
      && (!containerIndex || containers[containerIndex].spaceLeft > container.spaceLeft)) {
      containerIndex = index;
    }
  });
  return containerIndex;
};

export const createContainers = async (solanaBlock, slotNumber: number) => {
  const { blockhash, transactions: solanaTxs } = solanaBlock;
  const taggedTxs = addTagsToTxs(solanaTxs);

  let containerNumber = 0;
  return taggedTxs.reduce((txContainers, taggedTx) => {
    const { tags, transaction, bytes} = taggedTx;
    let txContainerIndex = findBFContainerIndex(txContainers, bytes);
    if (txContainerIndex === undefined) {
      txContainerIndex = (txContainers.push(createContainer(blockhash, slotNumber, containerNumber++)) - 1);
    }
    txContainers[txContainerIndex].txs.push(transaction);
    txContainers[txContainerIndex].tags = addTagsToContainer(txContainers[txContainerIndex].tags, tags);
    txContainers[txContainerIndex].spaceLeft -= bytes;
    return txContainers;
  }, [createContainer(blockhash, slotNumber, containerNumber++)])
};
