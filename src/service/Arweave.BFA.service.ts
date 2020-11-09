import { MAX_TAGS_SIZE, BLOCK_TAGS, SOLANA_NETWORKS } from '../constants';
import { addTagsToTxs, getTagsSize } from './Arweave.tag.service';
import { SOLANA_OPTIONS, OPTIONS } from '../config';

/**
 * Best Fit Algorithm Service
 */

export const getNetworkAlias = (networkUrl) => {
  const network = SOLANA_NETWORKS[networkUrl];
  if (network) {
    return network.alias;
  }
  return networkUrl;
};

const createContainer = (blockNumber, blockhash, slotNumber, containerNumber) => {
  const blockTags = {
    [`${BLOCK_TAGS.block.alias}`]: `${blockNumber}`,
    [`${BLOCK_TAGS.slot.alias}`]: `${slotNumber}`,
    [`${BLOCK_TAGS.blockhash.alias}`]: `${blockhash}`,
    [`${BLOCK_TAGS.container.alias}`]: `${containerNumber}`,
    [`${BLOCK_TAGS.network.alias}`]: `${getNetworkAlias(SOLANA_OPTIONS.url)}`,
    [`${BLOCK_TAGS.database.alias}`]: `${OPTIONS.database}`,
  };

  return {
    txs: [],
    tags: blockTags,
    spaceLeft: MAX_TAGS_SIZE - getTagsSize(blockTags),
  };
};

const addTagsToContainer = (
  containerTags = {}, txTags = {},
) => Object.keys(txTags).reduce((tags, tagKey) => {
  tags[tagKey] = tags[tagKey] ? [...new Set([...tags[tagKey], ...txTags[tagKey]])] : txTags[tagKey];
  return tags;
}, containerTags);

export const createBlockContainer = async (solanaBlock, blockNumber: number) => {
  const { blockhash, parentSlot: slotNumber, transactions: solanaTxs } = solanaBlock;
  const taggedTxs = addTagsToTxs(solanaTxs);

  let containerNumber = 0;

  const txContainers = [];
  for (let i = 0; i < taggedTxs.length; i++) {
    const { tags, transaction, bytes } = taggedTxs[i];
    txContainers.push(
      createContainer(blockNumber, blockhash, slotNumber, containerNumber++),
    );
    txContainers[i].txs.push(transaction);
    txContainers[i].tags = addTagsToContainer(txContainers[i].tags, tags);
    txContainers[i].spaceLeft -= bytes;
  }
  return txContainers;
};
