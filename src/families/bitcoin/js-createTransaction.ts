import { BigNumber } from "bignumber.js";
import type { Transaction } from "./types";

/**
 * Create an empty transaction
 *
 * @returns {Transaction}
 */
const createTransaction = (): Transaction => {
  return {
    family: "bitcoin",
    amount: new BigNumber(0),
    utxoStrategy: {
      strategy: 0,
      pickUnconfirmedRBF: false,
      excludeUTXOs: [],
    },
    recipient: "",
    rbf: false,
    feePerByte: null,
    networkInfo: null,
    useAllAmount: false,
    feesStrategy: "medium",
  };
};

export default createTransaction;
