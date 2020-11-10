import { expect } from 'chai';
import 'mocha';
import { initializeArweaveService } from '../../src/service/Arweave.service';
import searchService from '../../src/service/Arweave.search.service';
import { BLOCK_TAGS } from '../../src/constants';

describe('Search Service Tests', () => {
  before(() => initializeArweaveService());

  it('Should find data in Arweave', async () => {
    const blockhash = '8A2csXLUuXYLTZZ38Enz3VztiAZJeUasgR1jKdyWobJf';

    const txsFound = await searchService.searchByTag(BLOCK_TAGS.blockhash.alias, blockhash);

    expect(txsFound.length).to.be.at.least(58);
  });
});
