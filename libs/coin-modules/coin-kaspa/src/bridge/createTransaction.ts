import { BigNumber } from "bignumber.js";
import { AccountBridge } from "@ledgerhq/types-live";
import { KaspaTransactionCommon } from "../types/bridge";

export const createTransaction: AccountBridge<KaspaTransactionCommon>["createTransaction"] = () => ({
  family: "kaspa",
  mode: "send",
  amount: new BigNumber(0),
  fees: null,
  recipient: "",
  useAllAmount: false,
  rbf: false,
});

export default createTransaction;
