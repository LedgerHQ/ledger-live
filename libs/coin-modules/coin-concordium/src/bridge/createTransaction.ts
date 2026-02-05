import BigNumber from "bignumber.js";
import { AccountBridge } from "@ledgerhq/types-live";
import { Transaction } from "../types";

// We create an empty transaction that will be filled later
export const createTransaction: AccountBridge<Transaction>["createTransaction"] = () => ({
  family: "concordium",
  amount: new BigNumber(0),
  recipient: "",
  useAllAmount: false,
  fee: null,
  memo: undefined,
  networkInfo: null,
  feeCustomUnit: null,
});
