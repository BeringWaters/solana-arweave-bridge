#!/usr/bin/env node

const { program } = require('commander');
const fs = require('fs');
const { start } = require('../src');

const getConfig = (path) => {
    try {
        const config = fs.readFileSync(path);
        return JSON.parse(config)
    } catch (err) {
        console.error('\x1b[31m%s\x1b[0m', `${err}`);
        return {}
    }
};

program
    .description('This utility is a bridge to connect Solana ledger data to Arweave permanent storage.\n' +
      'Config file structure:\n' +
      '{\n' +
      '  solanaNodeUrl,\n' +
      '  arweaveNodeUrl,\n' +
      '  arweaveKeyPath,\n' +
      '}')
    .version(require('../package.json').version)
    .requiredOption('-c, --config <config>', 'Configuration file path')
    .option('-s, --startslot <startslot>', 'Solana\'s starting slot number')
    .option('-e, --endslot <endslot>', 'Solana\'s ending slot number')
    .option('-t, --threads <threads>', 'Number of fetching/writing threads', 1)
    .action(async (cmd) => {
        const {
            startslot,
            endslot,
            threads,
            config,
        } = cmd.opts();
        
        const configParsed = getConfig(config);
        
        const options = {
            startslot,
            endslot,
            threads,
            ...configParsed,
        };
        await start(options)
    });

program.parse(process.argv);
