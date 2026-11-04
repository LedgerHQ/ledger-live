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
    // "blk-" followed by the parent block hash, absent on the genesis block
    prev?: string;
  };
};

export type ExplorerBlockHash = {
  blockHash: string;
};

export type ExplorerTransactions<Amount extends ExplorerAmount = number> = {
  "current-round": number;
  "next-token": string;
  transactions: ExplorerTransaction<Amount>[];
};

// An amount read losslessly is a bigint when it exceeds Number.MAX_SAFE_INTEGER
export type ExplorerAmount = number | bigint;

export type ExplorerTransaction<Amount extends ExplorerAmount = number> = {
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
    amount: Amount;
    "asset-id": number;
    "close-amount"?: Amount;
    "close-to"?: string;
    receiver: string;
    // The clawed back account, when the asset manager revokes assets
    sender?: string;
  };
  "close-rewards": Amount;
  "closing-amount": Amount;
  "confirmed-round": number;
  fee: Amount;
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
  "inner-txns"?: ExplorerInnerTransaction<Amount>[];
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
    amount: Amount;
    "close-amount"?: Amount;
    "close-remainder-to"?: string;
    receiver: string;
  };
  "receiver-rewards": Amount;
  "round-time": number;
  sender: string;
  "sender-rewards": Amount;
  signature: {
    sig: string;
  };
  "tx-type": string;
};

// Inner transactions have no id of their own: they belong to the top-level transaction
export type ExplorerInnerTransaction<Amount extends ExplorerAmount = number> = Omit<
  ExplorerTransaction<Amount>,
  "id"
>;
