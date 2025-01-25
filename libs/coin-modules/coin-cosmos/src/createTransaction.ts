import { BigNumber } from "bignumber.js";
import { AccountBridge } from "@ledgerhq/types-live";
import type { CosmosDelegationInfo, Transaction } from "./types";

/**
 * Create an empty transaction
 *
 * @returns {Transaction}
 */
export const createTransaction: AccountBridge<Transaction>["createTransaction"] = () => ({
  family: "cosmos",
  mode: "send",
  amount: new BigNumber(0),
  fees: null,
  gas: null,
  recipient: "",
  useAllAmount: false,
  networkInfo: null,
  memo: null,
  sourceValidator: null,
  validators: [] as CosmosDelegationInfo[],
});

export default createTransaction;
