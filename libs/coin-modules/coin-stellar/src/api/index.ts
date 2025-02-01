import type {
  Api,
  Operation,
  Pagination,
  Transaction as ApiTransaction,
} from "@ledgerhq/coin-framework/api/index";
import coinConfig, { type StellarConfig } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  listOperations,
  lastBlock,
} from "../logic";

export function createApi(config: StellarConfig): Api {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast,
    combine: compose,
    craftTransaction: craft,
    estimateFees,
    getBalance,
    lastBlock,
    listOperations: operations,
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
async function craft(address: string, transaction: ApiTransaction): Promise<string> {
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

function compose(tx: string, signature: string, pubkey?: string): string {
  if (!pubkey) {
    throw new Error("Missing pubkey");
  }
  return combine(tx, signature, pubkey);
}

async function operations(
  address: string,
  _pagination: Pagination,
): Promise<[Operation[], string]> {
  // TODO will be fixed with https://github.com/LedgerHQ/ledger-live/pull/8898/files
  return listOperations(address, { limit: 200 });
}
