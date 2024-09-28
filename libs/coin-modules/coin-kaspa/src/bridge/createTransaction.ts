import { BigNumber } from "bignumber.js";
import { AccountBridge } from "@ledgerhq/types-live";
import { KaspaTransaction } from "../types/bridge";

export const createTransaction: AccountBridge<KaspaTransaction>["createTransaction"] = () => ({
  family: "kaspa",
  amount: new BigNumber(0),
  fees: null,
  recipient: "",
  useAllAmount: false,
  memo: null,
  mode: "send",
  assetId: null,
  later: "maybe",
  rbf: false,
});

export default createTransaction;
