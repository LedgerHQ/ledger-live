import BigNumber from "bignumber.js";
import { Transaction } from "../types";

export default function createTransaction(): Transaction {
  return {
    family: "tezos",
    mode: "send",
    amount: new BigNumber(0),
    fees: null,
    gasLimit: null,
    storageLimit: null,
    recipient: "",
    networkInfo: null,
    useAllAmount: false,
    taquitoError: null,
    estimatedFees: null,
  };
}
