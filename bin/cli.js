#!/usr/bin/env node

const { Command } = require('commander');
const { start } = require('../dist');
const { search } = require('../dist/service/Arweave.search.service');
const { updateOptions, updateSolanaOptions } = require('../dist/config');

const solanaArweaveBridge = new Command('Solana Arweave Bridge');

solanaArweaveBridge
    .description('This utility is a bridge to connect Solana ledger data to Arweave permanent storage.')
    .version(require('../package.json').version)
    .option('--startslot [startslot]', 'Solana\'s starting slot number')
    .option('--endslot [endslot]', 'Solana\'s ending slot number')
    .option('--concurrency [concurrency]', 'Number of fetching/writing threads')
    .option('--database [database]', 'Tag to identify bridge session')
    .option('--key [key]', 'Path to arweave key file')
    .option('--network [network]', 'Solana node url')
    .option('--rpc [rpc]', 'Solana rpc version')
    .option('--tagName [tagName]')
    .option('--tagValue [tagValue]');

solanaArweaveBridge
    .command('stream')
    .description('')
    .action(async () => {
        const {
            startslot,
            endslot,
            concurrency,
            key,
            database,
            network,
            rpc,
            cleanup
        } = solanaArweaveBridge;
        
        const livestream = (endslot === undefined);

        updateOptions({
            firstSlot: startslot,
            lastSlot: endslot,
            concurrency,
            livestream,
            key,
            database,
            cleanup
        });

        updateSolanaOptions({
            url: network,
            jsonrpc: rpc,
        });

        try {
            await start();
        } catch (e) {
            console.error(`Something went wrong: ${e}`);
        }
    });

solanaArweaveBridge
    .command('search')
    .description('Search transactions by tag')
    .action(async () => {
        const {
            tagName,
            tagValue,
        } = solanaArweaveBridge;

        try {
            const result = await search(tagName, tagValue);
            if (result.length === 0) {
                console.log('Nothing was found');
                return;
            }

            console.log(result.map((tx) => tx.signatures[0]));
        } catch (e) {
            console.error(`Something went wrong: ${e}`);
        }
    });

solanaArweaveBridge.parse(process.argv);
