import { expect } from 'chai';
import 'mocha';
import { createContainers } from '../../src/service/Arweave.BFA.service';

describe('BFA Service Tests', () => {
  it('Should create container', async () => {
    const solanaBlock = {
      blockTime: null,
      blockhash: 'AcknnkY4ok5BZuk69WijDETKVRUPZoMtniZHMe4ZaK1e',
      parentSlot: 0,
      previousBlockhash: '4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZAMdL4VZHirAn',
      rewards: [],
      transactions: [
        {
          meta: null,
          transaction: {
            message: {
              accountKeys: [
                'GdnSyH3YtwcxFvQrVVJMm1JhTS4QVX7MFsX56uJLUfiZ',
                'sCtiJieP8B3SwYnXemiLpRFRR8KJLMtsMVN25fAFWjW',
                'SysvarS1otHashes111111111111111111111111111',
                'SysvarC1ock11111111111111111111111111111111',
                'Vote111111111111111111111111111111111111111',
              ],
              header: {
                numReadonlySignedAccounts: 0,
                numReadonlyUnsignedAccounts: 3,
                numRequiredSignatures: 1,
              },
              instructions: [
                {
                  accounts: [
                    1,
                    2,
                    3,
                    0,
                  ],
                  data: '2ZjTR1vUs2pHXyTLpNez6FPzd1qvueZPaMpuuSaez2ARasvL8JYrcHe1U7SN8nkwgrrKwZ3FoRPVtCSfcqM',
                  programIdIndex: 4,
                },
              ],
              recentBlockhash: '4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZAMdL4VZHirAn',
            },
            signatures: [
              '39V8tR2Q8Ar3WwMBfVTRPFr7AakLHy5wp7skJNBL7ET6ARoikqc1TaMiuXEtHiNPLQKoeiVr5XnKH8QtjdonN4yM',
            ],
          },
        },
        {
          meta: null,
          transaction: {
            message: {
              accountKeys: [
                'CakcnaRDHka2gXyfbEd2d3xsvkJkqsLw2akB3zsN1D2S',
                '9bRDrYShoQ77MZKYTMoAsoCkU7dAR24mxYCBjXLpfEJx',
                'SysvarS1otHashes111111111111111111111111111',
                'SysvarC1ock11111111111111111111111111111111',
                'Vote111111111111111111111111111111111111111',
              ],
              header: {
                numReadonlySignedAccounts: 0,
                numReadonlyUnsignedAccounts: 3,
                numRequiredSignatures: 1,
              },
              instructions: [
                {
                  accounts: [
                    1,
                    2,
                    3,
                    0,
                  ],
                  data: '2ZjTR1vUs2pHXyTLpNez6FPzd1qvueZPaMpuuSaez2ARasvL8JYrcHe1U7SN8nkwgrrKwZ3FoRPVtCSfcqM',
                  programIdIndex: 4,
                },
              ],
              recentBlockhash: '4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZAMdL4VZHirAn',
            },
            signatures: [
              '4hPVA21e1KLQsEQkpSHk1UfkBBUfotajpkqESuV4tgqEdtEyDufaczAdZzSLexLhjytczDdSUFgwCTancgUWFzym',
            ],
          },
        },
        {
          meta: null,
          transaction: {
            message: {
              accountKeys: [
                'DE1bawNcRJB9rVm3buyMVfr8mBEoyyu73NBovf2oXJsJ',
                '8XgHUtBRY6qePVYERxosyX3MUq8NQkjtmFDSzQ2WpHTJ',
                'SysvarS1otHashes111111111111111111111111111',
                'SysvarC1ock11111111111111111111111111111111',
                'Vote111111111111111111111111111111111111111',
              ],
              header: {
                numReadonlySignedAccounts: 0,
                numReadonlyUnsignedAccounts: 3,
                numRequiredSignatures: 1,
              },
              instructions: [
                {
                  accounts: [
                    1,
                    2,
                    3,
                    0,
                  ],
                  data: '2ZjTR1vUs2pHXyTLpNez6FPzd1qvueZPaMpuuSaez2ARasvL8JYrcHe1U7SN8nkwgrrKwZ3FoRPVtCSfcqM',
                  programIdIndex: 4,
                },
              ],
              recentBlockhash: '4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZAMdL4VZHirAn',
            },
            signatures: [
              'FAWA66fudpiwdRDDQ4DRxdJsRvawvauwg4vQkm98ZHFpXmW5N7xzRiTRpt8QiZ19s1aVbzKgXW6kEZanwHeDFNS',
            ],
          },
        },
        {
          meta: null,
          transaction: {
            message: {
              accountKeys: [
                '7Np41oeYqPefeNQEHSv1UDhYrehxin3NStELsSKCT4K2',
                '4785anyR2rYSas6cQGHtykgzwYEtChvFYhcEgdDw3gGL',
                'SysvarS1otHashes111111111111111111111111111',
                'SysvarC1ock11111111111111111111111111111111',
                'Vote111111111111111111111111111111111111111',
              ],
              header: {
                numReadonlySignedAccounts: 0,
                numReadonlyUnsignedAccounts: 3,
                numRequiredSignatures: 1,
              },
              instructions: [
                {
                  accounts: [
                    1,
                    2,
                    3,
                    0,
                  ],
                  data: '2ZjTR1vUs2pHXyTLpNez6FPzd1qvueZPaMpuuSaez2ARasvL8JYrcHe1U7SN8nkwgrrKwZ3FoRPVtCSfcqM',
                  programIdIndex: 4,
                },
              ],
              recentBlockhash: '4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZAMdL4VZHirAn',
            },
            signatures: [
              '58A6RFEk5AoFqXTtKfqLhLrs7mhJYWGQTZegoCXPZuneM6Spi47SNYk2M6d9MVzHbC9CpBVk5vrq24yyNgeQNK2p',
            ],
          },
        },
      ],
    };
    const slotNumber = 1;
    const expectedTxContainer = {
      txs: [
        {
          message: {
            accountKeys: [
              'GdnSyH3YtwcxFvQrVVJMm1JhTS4QVX7MFsX56uJLUfiZ',
              'sCtiJieP8B3SwYnXemiLpRFRR8KJLMtsMVN25fAFWjW',
              'SysvarS1otHashes111111111111111111111111111',
              'SysvarC1ock11111111111111111111111111111111',
              'Vote111111111111111111111111111111111111111',
            ],
            header: {
              numReadonlySignedAccounts: 0,
              numReadonlyUnsignedAccounts: 3,
              numRequiredSignatures: 1,
            },
            instructions: [
              {
                accounts: [
                  1,
                  2,
                  3,
                  0,
                ],
                data: '2ZjTR1vUs2pHXyTLpNez6FPzd1qvueZPaMpuuSaez2ARasvL8JYrcHe1U7SN8nkwgrrKwZ3FoRPVtCSfcqM',
                programIdIndex: 4,
              },
            ],
            recentBlockhash: '4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZAMdL4VZHirAn',
          },
          signatures: [
            '39V8tR2Q8Ar3WwMBfVTRPFr7AakLHy5wp7skJNBL7ET6ARoikqc1TaMiuXEtHiNPLQKoeiVr5XnKH8QtjdonN4yM',
          ],
        },
        {
          message: {
            accountKeys: [
              'CakcnaRDHka2gXyfbEd2d3xsvkJkqsLw2akB3zsN1D2S',
              '9bRDrYShoQ77MZKYTMoAsoCkU7dAR24mxYCBjXLpfEJx',
              'SysvarS1otHashes111111111111111111111111111',
              'SysvarC1ock11111111111111111111111111111111',
              'Vote111111111111111111111111111111111111111',
            ],
            header: {
              numReadonlySignedAccounts: 0,
              numReadonlyUnsignedAccounts: 3,
              numRequiredSignatures: 1,
            },
            instructions: [
              {
                accounts: [
                  1,
                  2,
                  3,
                  0,
                ],
                data: '2ZjTR1vUs2pHXyTLpNez6FPzd1qvueZPaMpuuSaez2ARasvL8JYrcHe1U7SN8nkwgrrKwZ3FoRPVtCSfcqM',
                programIdIndex: 4,
              },
            ],
            recentBlockhash: '4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZAMdL4VZHirAn',
          },
          signatures: [
            '4hPVA21e1KLQsEQkpSHk1UfkBBUfotajpkqESuV4tgqEdtEyDufaczAdZzSLexLhjytczDdSUFgwCTancgUWFzym',
          ],
        },
        {
          message: {
            accountKeys: [
              'DE1bawNcRJB9rVm3buyMVfr8mBEoyyu73NBovf2oXJsJ',
              '8XgHUtBRY6qePVYERxosyX3MUq8NQkjtmFDSzQ2WpHTJ',
              'SysvarS1otHashes111111111111111111111111111',
              'SysvarC1ock11111111111111111111111111111111',
              'Vote111111111111111111111111111111111111111',
            ],
            header: {
              numReadonlySignedAccounts: 0,
              numReadonlyUnsignedAccounts: 3,
              numRequiredSignatures: 1,
            },
            instructions: [
              {
                accounts: [
                  1,
                  2,
                  3,
                  0,
                ],
                data: '2ZjTR1vUs2pHXyTLpNez6FPzd1qvueZPaMpuuSaez2ARasvL8JYrcHe1U7SN8nkwgrrKwZ3FoRPVtCSfcqM',
                programIdIndex: 4,
              },
            ],
            recentBlockhash: '4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZAMdL4VZHirAn',
          },
          signatures: [
            'FAWA66fudpiwdRDDQ4DRxdJsRvawvauwg4vQkm98ZHFpXmW5N7xzRiTRpt8QiZ19s1aVbzKgXW6kEZanwHeDFNS',
          ],
        },
        {
          message: {
            accountKeys: [
              '7Np41oeYqPefeNQEHSv1UDhYrehxin3NStELsSKCT4K2',
              '4785anyR2rYSas6cQGHtykgzwYEtChvFYhcEgdDw3gGL',
              'SysvarS1otHashes111111111111111111111111111',
              'SysvarC1ock11111111111111111111111111111111',
              'Vote111111111111111111111111111111111111111',
            ],
            header: {
              numReadonlySignedAccounts: 0,
              numReadonlyUnsignedAccounts: 3,
              numRequiredSignatures: 1,
            },
            instructions: [
              {
                accounts: [
                  1,
                  2,
                  3,
                  0,
                ],
                data: '2ZjTR1vUs2pHXyTLpNez6FPzd1qvueZPaMpuuSaez2ARasvL8JYrcHe1U7SN8nkwgrrKwZ3FoRPVtCSfcqM',
                programIdIndex: 4,
              },
            ],
            recentBlockhash: '4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZAMdL4VZHirAn',
          },
          signatures: [
            '58A6RFEk5AoFqXTtKfqLhLrs7mhJYWGQTZegoCXPZuneM6Spi47SNYk2M6d9MVzHbC9CpBVk5vrq24yyNgeQNK2p',
          ],
        },
      ],
      tags: {
        1: '1',
        2: '0',
        3: 'AcknnkY4ok5BZuk69WijDETKVRUPZoMtniZHMe4ZaK1e',
        4: '2',
        5: 'dev',
        a: [
          '0',
        ],
        b: [
          '3',
        ],
        c: [
          '1',
        ],
        d: [
          '39V8tR2Q8Ar3WwMBfVTRPFr7AakLHy5wp7skJNBL7ET6ARoikqc1TaMiuXEtHiNPLQKoeiVr5XnKH8QtjdonN4yM',
          '4hPVA21e1KLQsEQkpSHk1UfkBBUfotajpkqESuV4tgqEdtEyDufaczAdZzSLexLhjytczDdSUFgwCTancgUWFzym',
          'FAWA66fudpiwdRDDQ4DRxdJsRvawvauwg4vQkm98ZHFpXmW5N7xzRiTRpt8QiZ19s1aVbzKgXW6kEZanwHeDFNS',
          '58A6RFEk5AoFqXTtKfqLhLrs7mhJYWGQTZegoCXPZuneM6Spi47SNYk2M6d9MVzHbC9CpBVk5vrq24yyNgeQNK2p',
        ],
        e: [
          'GdnSyH3YtwcxFvQrVVJMm1JhTS4QVX7MFsX56uJLUfiZ',
          'sCtiJieP8B3SwYnXemiLpRFRR8KJLMtsMVN25fAFWjW',
          'SysvarS1otHashes111111111111111111111111111',
          'SysvarC1ock11111111111111111111111111111111',
          'Vote111111111111111111111111111111111111111',
          'CakcnaRDHka2gXyfbEd2d3xsvkJkqsLw2akB3zsN1D2S',
          '9bRDrYShoQ77MZKYTMoAsoCkU7dAR24mxYCBjXLpfEJx',
          'DE1bawNcRJB9rVm3buyMVfr8mBEoyyu73NBovf2oXJsJ',
          '8XgHUtBRY6qePVYERxosyX3MUq8NQkjtmFDSzQ2WpHTJ',
          '7Np41oeYqPefeNQEHSv1UDhYrehxin3NStELsSKCT4K2',
          '4785anyR2rYSas6cQGHtykgzwYEtChvFYhcEgdDw3gGL',
        ],
        f: [
          '4',
        ],
      },
      spaceLeft: 719,
    };

    const [txContainer] = await createContainers(solanaBlock, slotNumber);
    expect(expectedTxContainer).to.deep.equal(txContainer);
  });
});
