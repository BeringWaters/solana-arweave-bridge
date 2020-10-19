import { expect } from 'chai';
import 'mocha';
import { getCurrentSlot } from '../../src/api/Solana.api';

describe('Solana API Test', () => {
  it('Should retrieve the Current Slot', async () => {
    const result = await getCurrentSlot();

    expect(result).to.be.a('number');
    expect(result).to.be.above(0);
  });
});
