/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import CKB from "@nervosnetwork/ckb-sdk-core";
import { Indexer } from "@ckb-lumos/ckb-indexer";
import { getEnv } from "../../env";
import { systemScripts } from "@nervosnetwork/ckb-sdk-utils";
import { TX } from "./types";

const nodeUri = (): string => getEnv("API_NERVOS_NODE");
const indexUri = (): string => getEnv("API_NERVOS_INDEXER");

const ckb = new CKB(nodeUri());
const indexer = new Indexer(indexUri(), nodeUri());

export const getTransactionsByLockArgs = async (
  lockArgs: string,
  startBlockNumber: number
) => {
  const txs: TX[] = [];
  let lastCursor: string | undefined;
  do {
    const result = await indexer.getTransactions(
      {
        script_type: "lock",
        script: {
          hash_type: systemScripts.SECP256K1_BLAKE160.hashType,
          code_hash: systemScripts.SECP256K1_BLAKE160.codeHash,
          args: lockArgs,
        },
        filter: {
          block_range: [`0x${startBlockNumber.toString(16)}`, `0x7fffffff`],
        },
      },
      { ...(lastCursor && { lastCursor }) }
    );
    if (!result.objects.length) break;
    lastCursor = result.lastCursor;
    const txsHashes = result.objects.map(
      (indexerTransaction) => indexerTransaction.tx_hash
    );
    (await getTransactionsByHashes(txsHashes)).forEach((tx, i) =>
      txs.push({
        ...tx,
        blockNumber:
          !result.objects[i].block_number ||
          result.objects[i].block_number === "0x"
            ? 0
            : parseInt(result.objects[i].block_number, 16),
      })
    );
  } while (lastCursor && lastCursor !== "0x");
  return txs;
};

export const getTransactionsByHashes = async (txsHashes: string[]) => {
  const txs: TX[] = [];
  if (!txsHashes.length) return txs;
  const mapperFunction: (txHash: string) => ["getTransaction", string] = (
    txHash
  ) => ["getTransaction", txHash.toLowerCase()];
  const rpcResults = await ckb.rpc
    .createBatchRequest(txsHashes.map(mapperFunction))
    .exec();
  rpcResults.forEach((rpcResult) =>
    txs.push({
      ...rpcResult.transaction,
      status: rpcResult.txStatus.status,
      blockHash: rpcResult.txStatus.blockHash,
    })
  );
  return txs;
};

export const getBlockHeaders = async (blocksHashes: string[]) => {
  let blockHeaders: CKBComponents.BlockHeader[] = [];
  if (!blocksHashes.length) return blockHeaders;
  const mapperFunction: (blockHash: string) => ["getHeader", string] = (
    blockHash
  ) => ["getHeader", blockHash.toLowerCase()];
  const rpcResults = await ckb.rpc
    .createBatchRequest(blocksHashes.map(mapperFunction))
    .exec();
  blockHeaders = rpcResults;
  return blockHeaders;
};

export const sendTransaction = async (tx: CKBComponents.RawTransaction) => {
  return await ckb.rpc.sendTransaction(tx);
};

export const getCurrentBlockHeight = async () => {
  return parseInt(await ckb.rpc.getTipBlockNumber());
};
