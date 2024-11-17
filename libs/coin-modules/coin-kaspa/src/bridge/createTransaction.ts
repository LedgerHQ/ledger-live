import { KaspaTransaction } from "../types/bridge";
import { BigNumber } from "bignumber.js";

export const createTransaction = (): KaspaTransaction => ({
  amount: BigNumber(0),
  recipient: "",
  useAllAmount: false,
  feesStrategy: "slow",
  family: "kaspa",
  feerate: 1,
  rbf: true,
});

export default createTransaction;
