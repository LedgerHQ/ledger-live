import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { Transaction } from "../types";

// pathUSD fallback fee token
const PATHUSD_ADDRESS = "0x20c0000000000000000000000000000000000000";

export const createTransaction: AccountBridge<Transaction>["createTransaction"] = () => ({
  family: "tempo",
  amount: new BigNumber(0),
  recipient: "",
  fee: null,
  feeToken: PATHUSD_ADDRESS,
});
