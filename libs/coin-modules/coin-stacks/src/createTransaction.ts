import { AccountBridge } from "@ledgerhq/types-live";
import { Transaction } from "./types";
import BigNumber from "bignumber.js";
import { AnchorMode } from "@stacks/transactions";

export const createTransaction: AccountBridge<Transaction>["createTransaction"] = () => ({
  family: "stacks",
  recipient: "",
  amount: new BigNumber(0),
  network: "mainnet",
  anchorMode: AnchorMode.Any,
  useAllAmount: false,
});
