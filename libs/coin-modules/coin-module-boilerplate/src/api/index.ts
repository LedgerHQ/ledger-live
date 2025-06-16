import type {
  AlpacaApi,
  FeeEstimation,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/index";
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
import { BoilerplateAsset } from "../types";

export function createApi(config: BoilerplateConfig): AlpacaApi<BoilerplateAsset> {
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

async function craft(transactionIntent: TransactionIntent<BoilerplateAsset>): Promise<string> {
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

async function estimate(
  transactionIntent: TransactionIntent<BoilerplateAsset>,
): Promise<FeeEstimation> {
  const { serializedTransaction } = await craftTransaction(
    { address: transactionIntent.sender },
    {
      recipient: transactionIntent.recipient,
      amount: new BigNumber(transactionIntent.amount.toString()),
    },
  );

  const value = await estimateFees(serializedTransaction);

  return { value };
}
