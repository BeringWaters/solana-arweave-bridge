import axios from 'axios';
import { ARWEAVE_OPTIONS } from '../config';

export const getTransactionPrice = async (txNumberOfBytes: number) => {
  const response = await axios
    .get(`${ARWEAVE_OPTIONS.protocol}://${ARWEAVE_OPTIONS.host}/price/${txNumberOfBytes}`);
  return response;
};
