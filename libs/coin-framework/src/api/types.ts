export type BlockInfo = {
  height: number;
  hash?: string;
  // can be different from tx date
  // transaction could be created at a particular moment, but depending on network conditions
  // mining time, and block intervals, it might not get included in the blockchain until later
  time?: Date;
};

export type Operation<AssetInfo> = {
  type: string;
  // This operation corresponds to the index-th event triggered bu the original transaction
  operationIndex: number;
  senders: string[];
  recipients: string[];
  value: bigint;
  // Asset is not defined when dealing with native currency
  asset?: AssetInfo;
  // Field containing dedicated value for each blockchain
  details?: Record<string, unknown>;
  tx: {
    // One tx can trigger multiple operations, hence multiple operations with the same hash
    hash: string;
    // In which block this operation's related tx was included
    block: BlockInfo;
    fees: bigint;
    // see BlockInfo.time comment
    date: Date;
  };
};

export type Balance<AssetInfo> = {
  asset: AssetInfo;
  value: bigint;
};

export type Fees<FeeSettings> = {
  settings: FeeSettings;
  value: bigint;
};

export type TransactionIntent<AssetInfo, IntentDetails> = {
  type: string;
  sender: string;
  recipient: string;
  amount: bigint;
  asset?: AssetInfo;
} & IntentDetails;

export type Pagination = { minHeight: number };
export type Api<AssetInfo, IntentDetails, FeeSettings> = {
  broadcast: (tx: string) => Promise<string>;
  combine: (tx: string, signature: string, pubkey?: string) => string;
  estimateFees: (
    transactionIntent: TransactionIntent<AssetInfo, IntentDetails>,
    settings?: FeeSettings,
  ) => Promise<Fees<FeeSettings>>;
  craftTransaction: (
    transactionIntent: TransactionIntent<AssetInfo, IntentDetails>,
    customFees?: Fees<FeeSettings>,
  ) => Promise<string>;
  getBalance: (address: string) => Promise<AssetInfo[]>;
  lastBlock: () => Promise<BlockInfo>;
  listOperations: (
    address: string,
    pagination: Pagination,
  ) => Promise<[Operation<AssetInfo>[], string]>;
};

// Expected types:
//
// * stellar:
//   * AssetInfo:
//      * { type: "native" }
//   * IntentDetails:
//      * { memoType, memoValue }
//   * FeeSettings:
//      * {}
//
// * ripple:
//   * AssetInfo:
//      * { type: "native" }
//   * IntentDetails:
//      * { memos?: { type, data, format}[], destinationTag? }
//   * FeeSettings:
//      * {}
//
// * tezos:
//   * AssetInfo:
//      * { type: "native" }
//   * IntentDetails:
//      * {}
//   * FeeSettings:
//      * { gasLimit, storageLimit }
//
// * tron:
//   * AssetInfo:
//      * { type: "native" }
//      * { type: "token", standard: "trc10", tokenId  }
//      * { type: "token", standard: "trc20", contractAddress  }
//   * IntentDetails:
//      * { memo, expiration, feeLimit }
//   * FeeSettings:
//      * {}
