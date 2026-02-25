import { AccountBridge } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { DEFAULT_COIN_TYPE } from "../network/sdk";
import type { Transaction } from "../types";

/**
 * Create an empty transaction
 *
 * @returns {Transaction}
 */
export const createTransaction: AccountBridge<Transaction>["createTransaction"] = () => {
  const transaction: Transaction = {
    family: "sui" as const,
    mode: "send" as const,
    coinType: DEFAULT_COIN_TYPE,
    amount: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
    fees: null,
    errors: {},
  };
  return transaction;
};

export default createTransaction;
