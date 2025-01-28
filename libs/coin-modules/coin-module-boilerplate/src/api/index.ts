import type { Api } from "@ledgerhq/coin-framework/api/index";
import coinConfig, { type BoilerplateConfig } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  getNextValidSequence,
  lastBlock,
  listOperations,
} from "../common-logic";
import BigNumber from "bignumber.js";

export function createApi(config: BoilerplateConfig): Api {
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
  const tx = await craftTransaction(
    { address, nextSequenceNumber },
    {
      recipient: transaction.recipient,
      amount: new BigNumber(transaction.amount.toString()),
      fee: new BigNumber(transaction.fee.toString()),
    },
  );
  return tx.serializedTransaction;
}

//
async function estimate(addr: string, amount: bigint): Promise<bigint> {
  const { serializedTransaction } = await craftTransaction(
    { address: addr },
    { amount: new BigNumber(amount.toString()) },
  );
  return BigInt((await estimateFees(serializedTransaction)).toString());
}
