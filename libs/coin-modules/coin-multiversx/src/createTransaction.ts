import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { MIN_GAS_LIMIT } from "./constants";
import { Transaction } from "./types";

/**
 * Create an empty t
 *
 * @returns {Transaction}
 */
export const createTransaction: AccountBridge<Transaction>["createTransaction"] = () => {
  return {
    family: "multiversx",
    mode: "send",
    amount: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
    fees: new BigNumber(50000),
    gasLimit: MIN_GAS_LIMIT,
  };
};
