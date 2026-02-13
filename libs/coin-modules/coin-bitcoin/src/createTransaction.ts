import { BigNumber } from "bignumber.js";
import type { Transaction } from "./types";
import { AccountBridge } from "@ledgerhq/types-live";

/**
 * Create an empty transaction
 *
 * @returns {Transaction}
 */
export const createTransaction: AccountBridge<Transaction>["createTransaction"] = () => {
  return {
    family: "bitcoin",
    amount: new BigNumber(0),
    utxoStrategy: {
      strategy: 0,
      excludeUTXOs: [],
    },
    recipient: "",
    rbf: true,
    feePerByte: null,
    networkInfo: null,
    useAllAmount: false,
    feesStrategy: "medium",
  };
};

export default createTransaction;
