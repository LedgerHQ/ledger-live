import { BigNumber } from "bignumber.js";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { Transaction } from "../types/bridge";

/**
 * Create an empty Zcash transaction. Defaults to the "transparent" (t→t)
 * transfer type; `updateTransaction` re-derives `transferType` from the
 * (sender, recipientType) pair once the UI sets `sender`/`recipient`.
 */
export const createTransaction: AccountBridge<Transaction>["createTransaction"] = () => ({
  family: "zcash",
  amount: new BigNumber(0),
  recipient: "",
  transferType: "transparent",
  useAllAmount: false,
  feesStrategy: "medium",
});
