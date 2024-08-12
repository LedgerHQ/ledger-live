import type { Api } from "@ledgerhq/coin-framework/api/index";
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

async function estimate(_addr: string, _amount: bigint): Promise<bigint> {
  const fees = await estimateFees();
  return fees.fee;
}
