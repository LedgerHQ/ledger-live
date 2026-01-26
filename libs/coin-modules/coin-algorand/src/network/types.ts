import { BigNumber } from "bignumber.js";

// Algod v2 types
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

// Indexer types
export type AlgoTransactionDetails = AlgoPaymentInfo | AlgoAssetTransferInfo;

export enum AlgoTransactionType {
  PAYMENT = "pay",
  ASSET_TRANSFER = "axfer",
}

export interface AlgoTransaction {
  id: string;
  timestamp: string;
  round: number;
  senderAddress: string;
  senderRewards: BigNumber;
  recipientRewards: BigNumber;
  closeRewards: BigNumber | undefined;
  closeAmount: BigNumber | undefined;
  fee: BigNumber;
  note: string;
  type: string;
  details: AlgoTransactionDetails | undefined;
}

export interface AlgoPaymentInfo {
  amount: BigNumber;
  recipientAddress: string;
  closeAmount: BigNumber | undefined;
  closeToAddress: string | undefined;
}

export interface AlgoAssetTransferInfo {
  assetId: string;
  assetAmount: BigNumber;
  assetRecipientAddress: string;
  assetSenderAddress: string | undefined;
  assetCloseAmount: BigNumber | undefined;
  assetCloseToAddress?: string | undefined;
}

// Explorer response types (internal)
export type ExplorerAccount = {
  assets: {
    "asset-id": number;
    amount: number;
  }[];
  round: number;
  address: string;
  amount: number;
  "pending-rewards": number;
};

export type ExplorerTransactionParams = {
  "consensus-version": string;
  fee: number;
  "genesis-hash": string;
  "genesis-id": string;
  "first-round"?: number;
  "last-round": number;
  "min-fee": number;
};

export type ExplorerBroadcastReturn = {
  txId: string;
};

export type ExplorerBlock = {
  block: {
    rnd: number;
    ts: number;
    gh: string;
  };
};

export type ExplorerTransactions = {
  "current-round": number;
  "next-token": string;
  transactions: ExplorerTransaction[];
};

export type ExplorerTransaction = {
  "application-transaction"?: {
    accounts: string[];
    "application-args": string[];
    "application-id": number;
    "foreign-apps": unknown[];
    "foreign-assets": number[];
    "global-state-schema": {
      "num-byte-slice": number;
      "num-uint": number;
    };
    "local-state-schema": {
      "num-byte-slice": number;
      "num-uint": number;
    };
    "on-completion": string;
  };
  "asset-transfer-transaction"?: {
    amount: number;
    "asset-id": number;
    "close-amount": number;
    "close-to"?: string;
    receiver: string;
  };
  "close-rewards": number;
  "closing-amount": number;
  "confirmed-round": number;
  fee: number;
  "first-valid": number;
  "genesis-hash": string;
  "genesis-id": string;
  "global-state-delta": {
    key: string;
    value: {
      action: number;
      uint: number;
      bytes?: string;
    };
  }[];
  id: string;
  "intra-round-offset": number;
  "last-valid": number;
  "local-state-delta": {
    address: string;
    delta: {
      key: string;
      value: {
        action: number;
        uint: number;
      };
    }[];
  }[];
  note: string;
  "payment-transaction"?: {
    amount: number;
    "close-amount": number;
    "close-remainder-to"?: string;
    receiver: string;
  };
  "receiver-rewards": number;
  "round-time": number;
  sender: string;
  "sender-rewards": number;
  signature: {
    sig: string;
  };
  "tx-type": string;
};
