import type { Transaction } from "./types";
import BigNumber from "bignumber.js";

export function craftPsbtTransaction({
  psbt,
  finalizePsbt = false,
}: {
  psbt: string;
  finalizePsbt?: boolean;
}): Transaction {
  // For the PSBT we cannot provide the amount and recipient at the moment
  const liveTx: Transaction = {
    family: "bitcoin",
    amount: new BigNumber(0),
    utxoStrategy: {
      strategy: 0,
      excludeUTXOs: [],
    },
    recipient: "bc1qtthqrseeu4d2yw9yh0clw95066klvcyvqdk7fv",
    rbf: false,
    feePerByte: null,
    networkInfo: null,
    useAllAmount: false,
    feesStrategy: "medium",
    psbt,
    finalizePsbt,
  };

  return liveTx;
}
