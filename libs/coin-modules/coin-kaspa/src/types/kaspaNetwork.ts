import type { BigNumber } from "bignumber.js";

type KaspaOutpoint = {
  transactionId: string;
  index: number;
};
export type KaspaUtxo = {
  address: string;
  accountType: number;
  accountIndex: number;
  outpoint: KaspaOutpoint;
  utxoEntry: {
    amount: BigNumber;
    scriptPublicKey: {
      version: number;
      scriptPublicKey: string;
    };
    blockDaaScore: string;
    isCoinbase: boolean;
  };
};
