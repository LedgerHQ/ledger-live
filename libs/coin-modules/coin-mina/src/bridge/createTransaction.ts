import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { MinaAccount, Transaction } from "../types/common";

export const createTransaction: AccountBridge<
  Transaction,
  MinaAccount
>["createTransaction"] = () => ({
  family: "mina",
  amount: new BigNumber(0),
  recipient: "",
  useAllAmount: false,
  fees: {
    fee: new BigNumber(0),
    accountCreationFee: new BigNumber(0),
  },
  memo: undefined,
  nonce: 0,
});
