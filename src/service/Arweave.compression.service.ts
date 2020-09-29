import * as msgpack from 'msgpack-lite';

export const compressData = (data) => {
  const compressed = (msgpack.encode(data)).toString('base64');
  return compressed;
};

export const decompressData = async (compressed) => {
  const enc = new TextDecoder('utf-8');
  const buffer = Buffer.from(enc.decode(compressed), 'base64');
  const data = msgpack.decode(buffer);
  return data;
};
