import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { Transaction } from "../types";

export const createTransaction: AccountBridge<Transaction>["createTransaction"] = () => ({
  family: "canton",
  amount: new BigNumber(0),
  recipient: "",
  fee: null,
  memo: "",
  networkInfo: null,
  feeCustomUnit: null,
  tokenId: "",
});
