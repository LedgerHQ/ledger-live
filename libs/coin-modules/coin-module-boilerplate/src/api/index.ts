import type { Api, TransactionIntent } from "@ledgerhq/coin-framework/api/index";
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
import { BoilerplateToken } from "../types";

export function createApi(config: BoilerplateConfig): Api<BoilerplateToken> {
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

async function craft(transactionIntent: TransactionIntent<BoilerplateToken>): Promise<string> {
  const nextSequenceNumber = await getNextValidSequence(transactionIntent.sender);
  const tx = await craftTransaction(
    { address: transactionIntent.sender, nextSequenceNumber },
    {
      recipient: transactionIntent.recipient,
      amount: new BigNumber(transactionIntent.amount.toString()),
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
