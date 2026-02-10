import { AccountBridge } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type { Transaction } from "../types";

/**
 * Create an empty transaction
 *
 * @returns {Transaction}
 */
export const createTransaction: AccountBridge<Transaction>["createTransaction"] = () => {
  return {
    family: "polkadot",
    mode: "send",
    amount: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
    fees: null,
    validators: [],
    era: null,
    rewardDestination: null,
    numSlashingSpans: Number(0),
  };
};

export default createTransaction;
