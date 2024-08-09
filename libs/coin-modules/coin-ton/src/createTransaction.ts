import { AccountBridge } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type { Transaction } from "./types";

const createTransaction: AccountBridge<Transaction>["createTransaction"] = (): Transaction => ({
  family: "ton",
  amount: new BigNumber(0),
  fees: new BigNumber(0),
  recipient: "",
  useAllAmount: false,
  comment: {
    isEncrypted: false,
    text: "",
  },
});

export default createTransaction;
