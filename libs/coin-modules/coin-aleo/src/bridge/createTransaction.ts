import BigNumber from "bignumber.js";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { Transaction as AleoTransaction } from "../types";

export const createTransaction: AccountBridge<AleoTransaction>["createTransaction"] = () => {
  return {
    family: "aleo",
    amount: new BigNumber(0),
    useAllAmount: false,
    recipient: "",
    fees: new BigNumber(0),
  };
};
