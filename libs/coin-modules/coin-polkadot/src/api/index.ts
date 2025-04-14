import type {
  Api,
  Operation,
  Pagination,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/index";
import coinConfig, { type PolkadotConfig } from "../config";
import {
  broadcast,
  craftEstimationTransaction,
  craftTransaction,
  defaultExtrinsicArg,
  estimateFees,
  getBalance,
  lastBlock,
  listOperations,
} from "../logic";
import { PolkadotAsset } from "../types";

export function createApi(config: PolkadotConfig): Api<PolkadotAsset> {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast,
    combine: () => {
      throw new Error("UnsupportedMethod");
    },
    craftTransaction: craft,
    estimateFees: estimate,
    getBalance,
    lastBlock,
    listOperations: operations,
  };
}

async function craft(transactionIntent: TransactionIntent<PolkadotAsset>): Promise<string> {
  const extrinsicArg = defaultExtrinsicArg(transactionIntent.amount, transactionIntent.recipient);
  //TODO: Retrieve correctly the nonce via a call to the node `await api.rpc.system.accountNextIndex(address)`
  const nonce = 0;
  const tx = await craftTransaction(transactionIntent.sender, nonce, extrinsicArg);
  const extrinsic = tx.registry.createType("Extrinsic", tx.unsigned, {
    version: tx.unsigned.version,
  });
  return extrinsic.toHex();
}

async function estimate(transactionIntent: TransactionIntent<PolkadotAsset>): Promise<bigint> {
  const tx = await craftEstimationTransaction(transactionIntent.sender, transactionIntent.amount);
  const estimatedFees = await estimateFees(tx);
  return estimatedFees;
}

async function operations(
  address: string,
  { minHeight }: Pagination,
): Promise<[Operation<PolkadotAsset>[], string]> {
  const [ops, nextHeight] = await listOperations(address, { limit: 0, startAt: minHeight });
  return [ops, JSON.stringify(nextHeight)];
}
