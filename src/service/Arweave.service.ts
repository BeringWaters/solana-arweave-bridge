import { read } from 'fs-jetpack';
import { ARWEAVE_OPTIONS, OPTIONS } from '../config';

const Arweave = require('arweave');

export const arweave = Arweave.init ? Arweave.init(ARWEAVE_OPTIONS) : Arweave.default.init(ARWEAVE_OPTIONS);

export const wallet = {
  'key': undefined,
  'address': undefined,
};

(async () => {
  wallet.key = JSON.parse(read(`${OPTIONS.keyPath}`));
  wallet.address = await arweave.wallets.jwkToAddress(wallet.key);
})();
