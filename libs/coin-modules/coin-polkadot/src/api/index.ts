import type { Api } from "@ledgerhq/coin-framework/api/index";
import coinConfig, { type PolkadotConfig } from "../config";
import {
  broadcast,
  craftEstimationTransaction,
  craftTransaction,
  defaultExtrinsicArg,
  estimateFees,
  getBalance,
  listOperations,
} from "../logic";

export function createApi(config: PolkadotConfig): Api {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast,
    combine: () => {
      throw new Error("UnsupportedMethod");
    },
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
  },
): Promise<string> {
  const extrinsicArg = defaultExtrinsicArg(transaction.amount, transaction.recipient);
  //TODO: Retrieve correctly the nonce via a call to the node `await api.rpc.system.accountNextIndex(address)`
  const nonce = -1;
  const tx = await craftTransaction(address, nonce, extrinsicArg);
  const extrinsic = tx.registry.createType("Extrinsic", tx.unsigned, {
    version: tx.unsigned.version,
  });
  return extrinsic.toHex();
}

async function estimate(addr: string, amount: bigint): Promise<bigint> {
  const tx = await craftEstimationTransaction(addr, amount);
  return estimateFees(tx);
}
