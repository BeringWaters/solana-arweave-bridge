#!/usr/bin/env node
/* eslint-disable no-console */

const { Command } = require('commander');
const { stream, livestream, search } = require('../dist/src');
const { updateOptions, updateSolanaOptions, updateRedisOptions } = require('../dist/src/config');

const verifyStreamOptions = (options) => {
  const {
    startslot,
    endslot,
    concurrency,
    redisport,
  } = options;
  let verified = true;

  if (Number.isNaN(startslot)) {
    console.log('Starting slot must be a number');
    verified = false;
  }

  if (Number.isNaN(endslot)) {
    console.log('Ending slot must be a number');
    verified = false;
  }

  if (startslot > endslot) {
    console.log('Ending slot must be greater than starting slot');
    verified = false;
  }

  if (concurrency && Number.isNaN(concurrency)) {
    console.log('Concurrency must be a number');
    verified = false;
  }

  if (concurrency && concurrency < 1) {
    console.log('Concurrency must be a positive number');
    verified = false;
  }

  if (redisport && Number.isNaN(redisport)) {
    console.log('Redis port must be a number');
    verified = false;
  }

  return verified;
};

const verifyLivestreamOptions = (options) => {
  const {
    concurrency,
    redisport,
  } = options;
  let verified = true;

  if (concurrency && Number.isNaN(concurrency)) {
    console.log('Concurrency must be a number');
    verified = false;
  }

  if (concurrency && concurrency < 1) {
    console.log('Concurrency must be a positive number');
    verified = false;
  }

  if (redisport && Number.isNaN(redisport)) {
    console.log('Redis port must be a number');
    verified = false;
  }

  return verified;
};

const solanaArweaveBridge = new Command('Solana Arweave Bridge');

solanaArweaveBridge
  .description('This utility is a bridge to connect Solana ledger data to Arweave permanent storage.')
  .version(require('../package.json').version)
  .action(() => {
    console.log(solanaArweaveBridge.helpInformation());
    process.exit(0);
  });

solanaArweaveBridge
  .command('stream')
  .description('Start stream with specified options')
  .requiredOption('-s, --startslot [startslot] <number>', 'Solana\'s starting slot number', parseInt)
  .requiredOption('-e, --endslot [endslot] <number>', 'Solana\'s ending slot number', parseInt)
  .option('-c, --concurrency [concurrency] <number>', 'Number of fetching/writing threads. Default: 4', parseInt)
  .option('-d, --database [database] <string>', 'Tag to identify bridge session. Default: \'dev\'')
  .option('-k, --key [key] <string>', 'Path to arweave key file. Default: \'arweave-keyfile\'')
  .option('-v, --verify [verify] <boolean>', 'Check if Arweave transaction already exists to avoid data duplication. Default: false')
  .option('-n, --network [network] <string>', 'Solana node url. Default: \'https://testnet.solana.com\'')
  .option('-r, --rpc [rpc] <string>', 'Solana rpc version. Default: \'2.0\'')
  .option('-p, --redisport [redisport] <number>', 'Redis port. Default: 6379', parseInt)
  .option('-h, --redishost [redishost] <string>', 'Redis host. Default: \'127.0.0.1\'')
  .action(async (options) => {
    const {
      startslot,
      endslot,
      concurrency,
      key,
      database,
      network,
      rpc,
      verify,
      redisport,
      redishost,
    } = options;

    if (!verifyStreamOptions(options)) {
      process.exit(1);
    }

    updateOptions({
      concurrency,
      key,
      database,
      verify,
    });

    updateSolanaOptions({
      url: network,
      jsonrpc: rpc,
    });

    updateRedisOptions({
      redisport,
      redishost,
    });

    try {
      await stream(startslot, endslot);
    } catch (err) {
      console.error(`${err}`);
      process.exit(1);
    }
  });

solanaArweaveBridge
  .command('livestream')
  .description('Start livestream with specified options')
  .option('--concurrency [concurrency] <number>', 'Number of fetching/writing threads. Default: 4')
  .option('--database [database] <string>', 'Tag to identify bridge session. Default: \'dev\'')
  .option('--key [key] <string>', 'Path to arweave key file. Default: \'arweave-keyfile\'')
  .option('--cleanup [cleanup] <boolean>', 'Clean up Redis before start. Default: false')
  .option('--verify [verify] <boolean>', 'Check if Arweave transaction already exists to avoid data duplication. Default: false')
  .option('--network [network] <string>', 'Solana node url. Default: \'https://testnet.solana.com\'')
  .option('--rpc [rpc] <string>', 'Solana rpc version. Default: \'2.0\'')
  .option('--redisport [redisport] <number>', 'Redis port. Default: 6379')
  .option('--redishost [redishost] <string>', 'Redis host. Default: \'127.0.0.1\'')
  .action(async (options) => {
    const {
      concurrency,
      key,
      database,
      network,
      rpc,
      cleanup,
      verify,
      redisport,
      redishost,
    } = options;

    if (!verifyLivestreamOptions(options)) {
      process.exit(1);
    }

    updateOptions({
      concurrency,
      key,
      database,
      cleanup,
      verify,
    });

    updateSolanaOptions({
      url: network,
      jsonrpc: rpc,
    });

    updateRedisOptions({
      redisport,
      redishost,
    });

    try {
      await livestream();
    } catch (err) {
      console.error(`${err}`);
    }
  });

solanaArweaveBridge
  .command('search')
  .description('Search transactions by tag')
  .option('--tagname [tagname]')
  .option('--tagvalue [tagvalue]')
  .action(async () => {
    const {
      tagname,
      tagvalue,
    } = solanaArweaveBridge;

    try {
      const result = await search(tagname, tagvalue);
      if (result.length === 0) {
        console.log('Nothing was found');
        return;
      }
      console.log(result.map((tx) => tx.signatures[0]));
    } catch (err) {
      console.error(`${err}`);
    }
  });

solanaArweaveBridge.parse(process.argv);
