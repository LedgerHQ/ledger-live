import { BigNumber } from "bignumber.js";

export interface AlgoAccount {
  round: number;
  address: string;
  balance: BigNumber;
  pendingRewards: BigNumber;
  assets: AlgoAsset[];
}

export interface AlgoAsset {
  assetId: string;
  balance: BigNumber;
}

export interface AlgoTransactionParams {
  fee: number;
  minFee: number;
  firstRound: number;
  lastRound: number;
  genesisHash: string;
  genesisID: string;
}

export interface AlgoTransactionBroadcastResponse {
  txId: string;
}
