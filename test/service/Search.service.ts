import { expect } from 'chai';
import 'mocha';
import { initializeArweaveService } from '../../src/service/Arweave.service';
import searchService from '../../src/service/Arweave.search.service';
import { BLOCK_TAGS } from '../../src/constants';

describe('Search Service Tests', () => {
  before(() => {
    return initializeArweaveService();
  });

  it('Should find data in Arweave', async () => {
    const blockhash = 'AcknnkY4ok5BZuk69WijDETKVRUPZoMtniZHMe4ZaK1e';

    const txsFound = await searchService.searchByTag(BLOCK_TAGS.blockhash.alias, blockhash);

    expect(txsFound.length).to.be.at.least(8);
  });
});
