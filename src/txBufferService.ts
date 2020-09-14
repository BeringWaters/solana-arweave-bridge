import * as Redis from 'ioredis';
const redis = new Redis();

export const putTxsToBuffer = async (blockHash, txs) => {
    await redis.set(blockHash, txs);
};

export const getTxsFromBuffer = async (blockHash) => {
    redis.get(blockHash, function (err, result) {
        if (err) {
            return [];
        } else {
            return JSON.parse(result);
        }
    });
};

export const deleteTxsFromBuffer = async (blockHash) => {

};
