import { expect } from 'chai';
import 'mocha';
import { initializeArweaveService } from '../../src/service/Arweave.service';
import { getWalletBalance } from '../../src/api/Arweave.api';

describe('Arweave API Test', () => {
  before(() => {
    return initializeArweaveService();
  });

  it('Should get the appropriate balance', async () => {
    const balance = await getWalletBalance();

    expect(Number(balance)).not.to.be.a('NaN');
    expect(Number(balance)).to.be.at.least(0);
  });
});
