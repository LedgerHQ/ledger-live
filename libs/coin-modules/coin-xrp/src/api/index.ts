import type { Api, Operation } from "@ledgerhq/coin-framework/api/index";
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

async function craft(
  address: string,
  transaction: {
    mode: string;
    recipient: string;
    amount: bigint;
    fee: bigint;
  },
): Promise<string> {
  const nextSequenceNumber = await getNextValidSequence(address);
  const tx = await craftTransaction({ address, nextSequenceNumber }, transaction);
  return tx.serializedTransaction;
}

async function estimate(_addr: string, _amount: bigint): Promise<bigint> {
  const fees = await estimateFees();
  return fees.fee;
}

async function operations(address: string, blockHeight: number): Promise<Operation[]> {
  const ops = await listOperations(address, blockHeight);
  return ops.map(op => {
    const { simpleType, ...rest } = op;
    return { ...rest } satisfies Operation;
  });
}
