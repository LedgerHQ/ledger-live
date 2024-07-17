import type { Api } from "@ledgerhq/coin-framework/api/index";
import coinConfig, { type StellarConfig } from "../config";
import {
  broadcast,
  // combine,
  craftTransaction,
  // estimateFees,
  getBalance,
  listOperations,
  lastBlock,
  // rawEncode,
} from "../logic";

export function createApi(config: StellarConfig): Api {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast,
    combine: () => {
      throw new Error("Method not supported");
    },
    craftTransaction: craft,
    estimateFees: () => Promise.reject(new Error("Method not supported")),
    getBalance,
    lastBlock,
    listOperations,
  };
}

type Supplement = {
  assetCode?: string | undefined;
  assetIssuer?: string | undefined;
  memoType?: string | null | undefined;
  memoValue?: string | null | undefined;
};
function isSupplement(supplement: unknown): supplement is Supplement {
  return typeof supplement === "object";
}
async function craft(
  address: string,
  transaction: {
    mode: string;
    recipient: string;
    amount: bigint;
    fee: bigint;
    supplement?: unknown;
  },
): Promise<string> {
  const supplement = isSupplement(transaction.supplement)
    ? {
        assetCode: transaction.supplement?.assetCode,
        assetIssuer: transaction.supplement?.assetIssuer,
        memoType: transaction.supplement?.memoType,
        memoValue: transaction.supplement?.memoValue,
      }
    : {};
  const tx = await craftTransaction(
    { address },
    {
      ...transaction,
      assetCode: supplement?.assetCode,
      assetIssuer: supplement?.assetIssuer,
      memoType: supplement?.memoType,
      memoValue: supplement?.memoValue,
    },
  );
  return tx.xdr;
}
