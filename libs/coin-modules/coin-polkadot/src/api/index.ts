import type {
  Api,
  Transaction as ApiTransaction,
  TransactionIntent,
  Operation,
  Pagination,
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

export function createApi(config: PolkadotConfig): Api<void> {
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

async function craft(address: string, transaction: ApiTransaction): Promise<string> {
  const extrinsicArg = defaultExtrinsicArg(transaction.amount, transaction.recipient);
  //TODO: Retrieve correctly the nonce via a call to the node `await api.rpc.system.accountNextIndex(address)`
  const nonce = 0;
  const tx = await craftTransaction(address, nonce, extrinsicArg);
  const extrinsic = tx.registry.createType("Extrinsic", tx.unsigned, {
    version: tx.unsigned.version,
  });
  return extrinsic.toHex();
}

async function estimate(transactionIntent: TransactionIntent<void>): Promise<bigint> {
  const tx = await craftEstimationTransaction(transactionIntent.sender, transactionIntent.amount);
  const estimatedFees = await estimateFees(tx);
  return estimatedFees;
}

async function operations(
  address: string,
  { minHeight }: Pagination,
): Promise<[Operation<void>[], string]> {
  const [ops, nextHeight] = await listOperations(address, { limit: 0, startAt: minHeight });
  return [ops, JSON.stringify(nextHeight)];
}
