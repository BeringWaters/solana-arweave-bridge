import { ConfirmedTransactionMeta, Transaction } from "@solana/web3.js";
import * as dotenv from "dotenv";

const Arweave = require('arweave');
import moment = require("moment");

dotenv.config({ path: `.env` });

// TODO do we need to put this config to .env?
const arweaveOptions = {
  host: 'arweave.net',// Hostname or IP address for a Arweave host
  port: 443,          // Port
  protocol: 'https',  // Network protocol http or https
  timeout: 20000,     // Network request timeouts in milliseconds
  logging: false,     // Enable network request logging
}

const address = 'QkbQ9Cq7x6I7Jnmw5mePKDSEVavTMvABBPMJY6nGZLY'

const arweave = Arweave.init(arweaveOptions);

const wallet = require(`../${process.env.KEY_PATH}`)

export async function saveTxToArweave(solanaTx: { transaction: Transaction; meta: ConfirmedTransactionMeta | null }) {

  console.log({ solanaTx })

  const arweaveTx = await arweave.createTransaction(
    {
      target: address,
      data: `Test string: ${moment.now()}`,

      // quantity: tokens
    },
    wallet
  )

  // arweaveTx.addTag('Test-Tag', 'test tag')


  console.log({ arweaveTx })

  await arweave.transactions.sign(arweaveTx, wallet)
  console.log(arweaveTx.id)
  const result = await await arweave.transactions.post(arweaveTx)
  console.log({result})

}
