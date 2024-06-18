import BigNumber from "bignumber.js";
import { AccountBridge } from "@ledgerhq/types-live";
import { Transaction } from "./types";

/**
 * Create an empty transaction
 *
 * @returns {Transaction}
 */
export const createTransaction: AccountBridge<Transaction>["createTransaction"] = () => ({
  family: "crypto_org",
  mode: "send",
  amount: new BigNumber(0),
  recipient: "",
  useAllAmount: false,
  fees: new BigNumber(0),
  memo: null,
});
