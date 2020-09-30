#!/usr/bin/env node

const { Command } = require('commander');
const { start } = require('./dist/index');
const { searchByParameter, searchByIterableParameter } = require('./dist/service/Arweave.search.service');
const { updateOptions, updateSolanaOptions } = require('./dist/config');

const solanaArweaveBridge = new Command('Solana Arweave Bridge');

solanaArweaveBridge
    .description('This utility is a bridge to connect Solana ledger data to Arweave permanent storage.')
    .version(require('./package.json').version)
    .option('--startslot [startslot]', 'Solana\'s starting slot number')
    .option('--endslot [endslot]', 'Solana\'s ending slot number')
    .option('--livestream [livestream]', 'Livestream (if end slot is specified - it is not taken into account)')
    .option('--concurrency [concurrency]', 'Number of fetching/writing threads')
    .option('--key [key]', 'Path to arweave key file')
    .option('--database [database]', 'Tag to identify bridge session')
    .option('--network [network]', 'Solana node url')
    .option('--rpc [rpc]', 'Solana rpc version')
    .option('--pname [pname]')
    .option('--pvalue [pvalue]')
    .option('--iterable [iterable]');

solanaArweaveBridge
    .command('stream')
    .description('')
    .action(async () => {
        const {
            startslot,
            endslot,
            livestream,
            concurrency,
            key,
            database,
            network,
            rpc
        } = solanaArweaveBridge;

        updateOptions({
            firstSlot: startslot,
            lastSlot: endslot,
            livestream,
            concurrency,
            key,
            database,
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
    .description('Search by tx publicKey')
    .action(async () => {
        const {
            pname,
            pvalue,
            iterable,
        } = solanaArweaveBridge;

        try {
            const result = [];
            if (iterable) {
                result.push(...await searchByIterableParameter(pname, pvalue));
            } else {
                result.push(...await searchByParameter(pname, pvalue));
            }
            console.log(result.map((tx) => tx.signatures[0]));
        } catch (e) {
            console.error(`Something went wrong: ${e}`);
        }
    });

solanaArweaveBridge.parse(process.argv);
