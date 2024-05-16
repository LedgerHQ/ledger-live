import { BigNumber } from "bignumber.js";
import type { Transaction } from "./types";
import { AccountBridge } from "@ledgerhq/types-live";

export const createTransaction: AccountBridge<Transaction>["createTransaction"] = () => {
  return {
    family: "solana",
    amount: new BigNumber(0),
    useAllAmount: false,
    recipient: "",
    model: {
      kind: "transfer",
      uiState: {},
    },
  };
};

export default createTransaction;
