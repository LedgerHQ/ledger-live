import { isEqual } from "lodash";
import { AccountBridge } from "@ledgerhq/types-live";
import { Transaction } from "./types";

export const updateTransaction: AccountBridge<Transaction>["updateTransaction"] = (tx, patch) => {
  let patched;
  if ("recipient" in patch && patch.recipient !== tx.recipient) {
    patched = {
      ...tx,
      ...patch,
      userGasLimit: null,
      estimatedGasLimit: null,
    };
  }

  patched = { ...tx, ...patch };
  return isEqual(tx, patched) ? tx : patched;
};

export default updateTransaction;
