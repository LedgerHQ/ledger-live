import type {
  Api,
  Operation,
  Transaction as ApiTransaction,
  Pagination,
} from "@ledgerhq/coin-framework/api/index";
import coinConfig, { type XrpConfig } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  getNextValidSequence,
  lastBlock,
  listOperations,
} from "../logic";

export function createApi(config: XrpConfig): Api {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast,
    combine,
    craftTransaction: craft,
    estimateFees: estimate,
    getBalance,
    lastBlock,
    listOperations: operations,
  };
}

async function craft(address: string, transaction: ApiTransaction): Promise<string> {
  const nextSequenceNumber = await getNextValidSequence(address);
  const tx = await craftTransaction({ address, nextSequenceNumber }, transaction);
  return tx.serializedTransaction;
}

async function estimate(_addr: string, _amount: bigint): Promise<bigint> {
  const fees = await estimateFees();
  return fees.fee;
}

async function operations(
  address: string,
  { limit, start }: Pagination,
): Promise<[Operation[], number]> {
  const [ops, index] = await listOperations(address, { limit, mostRecentIndex: start });
  return [
    ops.map(op => {
      const { simpleType, blockHash, blockTime, ...rest } = op;
      return {
        ...rest,
        block: {
          height: rest.blockHeight,
          hash: blockHash,
          time: blockTime,
        },
      } satisfies Operation;
    }),
    index,
  ];
}
