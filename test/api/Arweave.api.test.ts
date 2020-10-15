import { expect } from 'chai';
import 'mocha';
import { getWalletBalance } from '../../src/api/Arweave.api';

describe('Arweave API Test', () => {
  it('Should get the appropriate balance', async () => {
    const balance = await getWalletBalance();

    expect(Number(balance)).not.to.be.a('NaN');
    expect(Number(balance)).to.be.at.least(0);
  });
});
