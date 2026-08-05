import BigNumber from "bignumber.js";
import { AccountBridge } from "@ledgerhq/types-live";
import { generateNonce } from "../common-logic";
import { getChainTag } from "../config";
import { Transaction } from "../types";

/**
 * Create an empty VET or VTHO transaction
 *
 * @returns {Transaction}
 */
export const createTransaction: AccountBridge<Transaction>["createTransaction"] = () => {
  const chainTag = getChainTag();

  return {
    family: "vechain",
    body: {
      chainTag,
      blockRef: "0x0000000000000000",
      expiration: 18,
      clauses: [],
      maxFeePerGas: 0,
      maxPriorityFeePerGas: 0,
      gas: "0",
      dependsOn: null,
      nonce: generateNonce(),
    },
    amount: new BigNumber(0),
    estimatedFees: "0",
    recipient: "",
    useAllAmount: false,
  };
};
