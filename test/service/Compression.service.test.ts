import { expect } from 'chai';
import 'mocha';
import * as msgpack from 'msgpack-lite';

import { compressData, decompressData } from '../../src/service/Arweave.compression.service';

describe('Compression Service Tests', () => {
  it('Should compress a sample JSON object', async () => {
    const data = await compressData({ example: 'hello world' });
    expect(data).to.be.a('string');
  });

  it('Should compress and decompress a sample JSON object', async () => {
    const data = await compressData('hello world');
    expect(data).to.be.a('string');

    const parsed = await decompressData(msgpack.encode(data));
    expect(parsed).equals('hello world');
  });
});
