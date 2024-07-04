import { BigNumber } from "bignumber.js";
import { AccountBridge } from "@ledgerhq/types-live";
import type { Transaction } from "./types";

/**
 * Create an empty transaction
 *
 * @returns {Transaction}
 */
export const createTransaction: AccountBridge<Transaction>["createTransaction"] = () => ({
  family: "stellar",
  amount: new BigNumber(0),
  baseReserve: null,
  networkInfo: null,
  fees: null,
  recipient: "",
  memoValue: null,
  memoType: null,
  useAllAmount: false,
  mode: "send",
  assetCode: "",
  assetIssuer: "",
});

export default createTransaction;
