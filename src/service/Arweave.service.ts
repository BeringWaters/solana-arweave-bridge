import { read } from 'fs-jetpack';
import { ARWEAVE_OPTIONS, OPTIONS } from '../config';

const Arweave = require('arweave');

export let arweave;

export const wallet = {
  'key': undefined,
  'address': undefined,
};

export const initializeArweaveService = async () => {
  arweave = Arweave.init ? Arweave.init(ARWEAVE_OPTIONS) : Arweave.default.init(ARWEAVE_OPTIONS);

  const keyJSON = read(`${OPTIONS.key}`);
  if (!keyJSON) {
    throw new Error('Arweave key file malformed or doesn\'t exist');
  }

  wallet.key = await JSON.parse(keyJSON);
  wallet.address = await arweave.wallets.jwkToAddress(wallet.key);
};
