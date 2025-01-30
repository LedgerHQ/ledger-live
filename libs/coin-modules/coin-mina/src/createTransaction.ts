import BigNumber from "bignumber.js";
import { MinaAccount, Transaction } from "./types";
import { AccountBridge } from "@ledgerhq/types-live";

export const createTransaction: AccountBridge<
  Transaction,
  MinaAccount
>["createTransaction"] = () => ({
  family: "mina",
  amount: new BigNumber(0),
  recipient: "",
  useAllAmount: false,
  fees: new BigNumber(0),
  memo: undefined,
});
