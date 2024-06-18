import { BigNumber } from "bignumber.js";
import type { Transaction } from "./types";
import { AccountBridge } from "@ledgerhq/types-live";

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
