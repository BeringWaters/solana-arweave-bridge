import { Queue } from 'bullmq';
import { Connection } from '@solana/web3.js'

export const start = async (options) => {
    // Solana Jobs
    // TODO: start multiple jobs according to options
    const { solanaNodeUrl } = options;
    console.log({ SOLANA_NODE_URL: options.solanaNodeUrl });
    const connection = new Connection(options.solanaNodeUrl);
    const solanaQueue = new Queue('Solana');
    await solanaQueue.add('solanaJob', { solanaNodeUrl });

    // Arweave Jobs
};
