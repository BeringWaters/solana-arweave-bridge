import { and, or, equals } from 'arql-ops';

export const search = async (arweave) => {
  const myQuery = and(
    equals('network', 'testnet'),
  );

  const results = await arweave.arql(myQuery);
  return results;
};
