import type { Api } from "@ledgerhq/coin-framework/api/index";
import coinConfig, { type TezosConfig } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  // estimateFees,
  getBalance,
  listOperations,
  rawEncode,
} from "../logic";

export function createApi(config: TezosConfig): Api {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast,
    combine,
    craftTransaction: craft,
    estimateFees: () => Promise.resolve(BigInt(0)),
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
  const { contents } = await craftTransaction(
    { address },
    { ...transaction, type: "send", fee: { fees: transaction.fee.toString() } },
  );
  return rawEncode(contents);
}
