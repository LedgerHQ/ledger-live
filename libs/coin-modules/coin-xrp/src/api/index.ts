import { setCoinConfig, XrpConfig } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  getNextValidSequence,
  listOperations,
  type Operation,
} from "../logic";

export type Api = {
  broadcast: (tx: string) => Promise<string>;
  combine: (tx: string, signature: string, pubkey: string) => string;
  craftTransaction: (
    address: string,
    transaction: {
      recipient: string;
      amount: bigint;
      fee: bigint;
    },
  ) => Promise<string>;
  estimateFees: () => Promise<bigint>;
  getBalance: (address: string) => Promise<bigint>;
  listOperations: (address: string, blockHeight: number) => Promise<Operation[]>;
};
export function createApi(config: XrpConfig): Api {
  setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast,
    combine,
    craftTransaction: craft,
    estimateFees: estimate,
    getBalance,
    listOperations,
  };
}

async function craft(
  address: string,
  transaction: {
    recipient: string;
    amount: bigint;
    fee: bigint;
  },
): Promise<string> {
  const nextSequenceNumber = await getNextValidSequence(address);
  const tx = await craftTransaction({ address, nextSequenceNumber }, transaction);
  return tx.serializedTransaction;
}

async function estimate(): Promise<bigint> {
  const fees = await estimateFees();
  return fees.fee;
}
