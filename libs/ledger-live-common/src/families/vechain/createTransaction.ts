import BigNumber from "bignumber.js";
import { AccountBridge } from "@ledgerhq/types-live";
import { DEFAULT_GAS_COEFFICIENT, MAINNET_CHAIN_TAG } from "./constants";
import { generateNonce } from "./utils/transaction-utils";
import { Transaction } from "./types";

/**
 * Create an empty VET or VTHO transaction
 *
 * @returns {Transaction}
 */
export const createTransaction: AccountBridge<Transaction>["createTransaction"] = () => {
  const chainTag = MAINNET_CHAIN_TAG;

  return {
    family: "vechain",
    body: {
      chainTag,
      blockRef: "0x0000000000000000",
      expiration: 18,
      clauses: [],
      gasPriceCoef: DEFAULT_GAS_COEFFICIENT,
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
