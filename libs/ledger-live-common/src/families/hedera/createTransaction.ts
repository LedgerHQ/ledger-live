import BigNumber from "bignumber.js";
import { AccountBridge } from "@ledgerhq/types-live";
import { Transaction } from "./types";

/**
 * Creates an empty transaction.
 *
 * @returns {Transaction}
 */
export const createTransaction: AccountBridge<Transaction>["createTransaction"] = () => ({
  family: "hedera",
  amount: new BigNumber(0),
  recipient: "",
  useAllAmount: false,
});
