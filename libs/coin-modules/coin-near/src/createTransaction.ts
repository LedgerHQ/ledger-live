import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { Transaction } from "./types";

export const createTransaction: AccountBridge<Transaction>["createTransaction"] = () => ({
  family: "near",
  mode: "send",
  amount: new BigNumber(0),
  recipient: "",
  useAllAmount: false,
  fees: new BigNumber(0),
  // Inert here (buildTransaction reads the access key's nonce), but fromTransactionRaw revives a
  // missing nonce as zero, so seeding it keeps the serialization round-trip exact on this route too.
  nonce: new BigNumber(0),
});
