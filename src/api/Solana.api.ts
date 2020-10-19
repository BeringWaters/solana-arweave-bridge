import axios from 'axios';
import { SOLANA_OPTIONS, MAX_RESPONSE_ATTEMPTS } from '../config';

// Add a response interceptor
axios.interceptors.response.use((response) => {
  if (response.data.error) {
    return Promise.reject(`${response.data.error.message}`);
  }
  return response;
}, (error) => {
  // Any status codes that falls outside the range of 2xx cause this function to trigger
  const { response, config: originalRequest } = error;
  if (response && (response.status === 429 || response.status === 504)
    && (!originalRequest.retry || originalRequest.retry <= MAX_RESPONSE_ATTEMPTS)) {
    originalRequest.retry = originalRequest.retry ? originalRequest.retry + 1 : 1;
    return (new Promise(resolve => setTimeout(resolve, originalRequest.retry * 1000)))
      .then(() => axios(originalRequest));
  }
  return Promise.reject(`${error.message}: ${response.statusText}`);
});

const createErrorMessage = (err, method) => {
  return `API error. Message: ${err}. Method ${method}. URL: ${SOLANA_OPTIONS.url}`;
};

export async function getGenesisHash(id: number = 1) {
  const { data } = await axios
    .post(SOLANA_OPTIONS.url, {
      jsonrpc: SOLANA_OPTIONS.jsonrpc,
      id,
      method: `getGenesisHash`,
    })
    .catch((err) => {
      throw new Error(createErrorMessage(err, 'getGenesisHash'));
    });

  return data;
}

export async function getFirstSlot(id: number = 1) {
  const { data } = await axios
    .post(SOLANA_OPTIONS.url, {
      jsonrpc: SOLANA_OPTIONS.jsonrpc,
      id,
      method: `getFirstAvailableBlock`,
    })
    .catch((err) => {
      throw new Error(createErrorMessage(err, 'getFirstSlot'));
    });

  return data.result;
}

export async function getCurrentSlot(id: number = 1) {
  const { data } = await axios
    .post(SOLANA_OPTIONS.url, {
      jsonrpc: SOLANA_OPTIONS.jsonrpc,
      id,
      method: `getSlot`,
    })
    .catch((err) => {
      throw new Error(createErrorMessage(err, 'getCurrentSlot'));
    });

  return data.result;
}

export async function getConfirmedBlock(index: number, id?: number) {
  const { data } = await axios
    .post(SOLANA_OPTIONS.url, {
      jsonrpc: SOLANA_OPTIONS.jsonrpc,
      id: (id ? id : index),
      method: `getConfirmedBlock`,
      params: [index],
    })
    .catch((err) => {
      throw new Error(createErrorMessage(err, 'getConfirmedBlock'));
    });

  return data;
}

export const getConfirmedBlocks = async (start: number, end: number, id?: number) => {
  const { data } = await axios
    .post(SOLANA_OPTIONS.url, {
      jsonrpc: SOLANA_OPTIONS.jsonrpc,
      id: (id ? id : start),
      method: `getConfirmedBlocks`,
      params: [start, end],
    })
    .catch((err) => {
      throw new Error(createErrorMessage(err, 'getConfirmedBlocks'));
    });

  return data;
};

export default {
  getGenesisHash,
  getFirstSlot,
  getCurrentSlot,
  getConfirmedBlock,
  getConfirmedBlocks,
}
