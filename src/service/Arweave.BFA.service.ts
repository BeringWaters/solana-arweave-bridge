import { MAX_TAGS_SIZE, BLOCK_TAGS, SOLANA_NETWORKS } from '../constants';
import { addTagsToTxs, getTagsSize } from './Arweave.tag.service';
import { SOLANA_OPTIONS, OPTIONS } from '../config';

/**
 * Best Fit Algorithm Service
 */

const getNetworkAlias = (networkUrl) => {
  const network = SOLANA_NETWORKS[networkUrl];
  if (network) {
    return network.alias;
  }
  return networkUrl;
};

const createContainer = (blockNumber, blockhash, slotNumber, containerNumber) => {
  const blockTags = {
    [`${BLOCK_TAGS['block'].alias}`]: `${blockNumber}`,
    [`${BLOCK_TAGS['slot'].alias}`]: `${slotNumber}`,
    [`${BLOCK_TAGS['blockhash'].alias}`]: `${blockhash}`,
    [`${BLOCK_TAGS['container'].alias}`]: `${containerNumber}`,
    [`${BLOCK_TAGS['network'].alias}`]: `${getNetworkAlias(SOLANA_OPTIONS.url)}`,
    [`${BLOCK_TAGS['database'].alias}`]: `${OPTIONS.database}`,
  };

  return {
    txs: [],
    tags: blockTags,
    spaceLeft: MAX_TAGS_SIZE - getTagsSize(blockTags),
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

export const createContainers = async (solanaBlock, blockNumber: number) => {
  const { blockhash, parentSlot: slotNumber, transactions: solanaTxs } = solanaBlock;
  const taggedTxs = addTagsToTxs(solanaTxs);

  let containerNumber = 0;
  return taggedTxs.reduce((txContainers, taggedTx) => {
    const { tags, transaction, bytes} = taggedTx;
    let txContainerIndex = findBFContainerIndex(txContainers, bytes);
    if (txContainerIndex === undefined) {
      txContainerIndex = (txContainers.push(createContainer(blockNumber, blockhash, slotNumber, containerNumber++)) - 1);
    }
    txContainers[txContainerIndex].txs.push(transaction);
    txContainers[txContainerIndex].tags = addTagsToContainer(txContainers[txContainerIndex].tags, tags);
    txContainers[txContainerIndex].spaceLeft -= bytes;
    return txContainers;
  }, [createContainer(blockNumber, blockhash, slotNumber, containerNumber++)])
};
