import { BigNumber } from "bignumber.js";
import type { Transaction } from "./types";

/**
 * Create an empty transaction
 *
 * @returns {Transaction}
 */

const createTransaction = (): Transaction => ({
  family: "algorand",
  amount: new BigNumber(0),
  fees: null,
  recipient: "",
  useAllAmount: false,
  memo: null,
  mode: "send",
  assetId: null,
});

export default createTransaction;
