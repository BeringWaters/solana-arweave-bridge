import axios from 'axios';
import { SOLANA_OPTIONS } from '../config';

export async function getGenesisHash(id: number = 1) {
  const { data } = await axios
    .post(SOLANA_OPTIONS.url, {
      jsonrpc: SOLANA_OPTIONS.jsonrpc,
      id,
      method: `getGenesisHash`,
    });

  return data;
}

export async function getFirstSlot(id: number = 1) {
  const { data } = await axios
    .post(SOLANA_OPTIONS.url, {
      jsonrpc: SOLANA_OPTIONS.jsonrpc,
      id,
      method: `getFirstAvailableBlock`,
    });

  return data;
}

export async function getCurrentSlot(id: number = 1) {
  const { data } = await axios
    .post(SOLANA_OPTIONS.url, {
      jsonrpc: SOLANA_OPTIONS.jsonrpc,
      id,
      method: `getSlot`,
    });

  return data;
}

export async function getConfirmedBlock(index: number, id?: number) {
  const { data } = await axios
    .post(SOLANA_OPTIONS.url, {
      jsonrpc: SOLANA_OPTIONS.jsonrpc,
      id: (id ? id : index),
      method: `getConfirmedBlock`,
      params: [index],
    });

  return data;
}

export const getConfirmedSlots = async (start: number, end: number, id?: number) => {
  const { data } = await axios
    .post(SOLANA_OPTIONS.url, {
      jsonrpc: SOLANA_OPTIONS.jsonrpc,
      id: (id ? id : start),
      method: `getConfirmedBlocks`,
      params: [start, end],
    });

  return data;
};
