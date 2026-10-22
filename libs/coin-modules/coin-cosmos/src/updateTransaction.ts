import { updateTransaction as defaultUpdateTransaction } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { AccountBridge } from "@ledgerhq/types-live";
import { Transaction } from "./types";

export const updateTransaction: AccountBridge<Transaction>["updateTransaction"] = (tx, patch) => {
  if (
    ("mode" in patch && patch.mode !== tx.mode) ||
    ("valAddress" in patch && patch.valAddress !== (tx as { valAddress?: string }).valAddress) ||
    ("dstValAddress" in patch &&
      patch.dstValAddress !== (tx as { dstValAddress?: string }).dstValAddress)
  ) {
    patch = { ...patch, gas: null, fees: null };
  }

  return defaultUpdateTransaction(tx, patch);
};

export default updateTransaction;
