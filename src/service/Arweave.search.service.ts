import { and, or, equals } from 'arql-ops';

export const searchBySlotNumber = async (arweave, parameters) => {
  const myQuery = and(
    equals('1', parameters['1']),
  );

  const results = await arweave.arql(myQuery);
  return results;
};
