import { AccountBridge } from "@ledgerhq/types-live";
import { AnchorMode } from "@stacks/transactions";
import BigNumber from "bignumber.js";
import { Transaction } from "../types";

export const createTransaction: AccountBridge<Transaction>["createTransaction"] = () => ({
  family: "stacks",
  recipient: "",
  amount: new BigNumber(0),
  network: "mainnet",
  anchorMode: AnchorMode.Any,
  useAllAmount: false,
});
