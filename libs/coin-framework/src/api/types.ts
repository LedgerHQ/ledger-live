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

export type Transaction = {
  type: string;
  recipient: string;
  amount: bigint;
  fee: bigint;
} & Record<string, unknown>; // Field containing dedicated value for each blockchain

// TODO add a `token: string` field to the pagination if we really need to support pagination (which is not the case for now)
export type Asset = {
  native: bigint;
};

export type TransactionIntent<AssetInfo> = {
  type: string;
  sender: string;
  recipient: string;
  amount: bigint;
  asset?: AssetInfo;
} & Record<string, unknown>;

// TODO rename start to minHeight
//       and add a `token: string` field to the pagination if we really need to support pagination
//       (which is not the case for now)
//       for now start is used as a minHeight from which we want to fetch ALL operations
//       limit is unused for now
//       see design document at https://ledgerhq.atlassian.net/wiki/spaces/BE/pages/5446205788/coin-modules+lama-adapter+APIs+refinements
export type Pagination = { minHeight: number };
export type Api<TokenIdentifier> = {
  broadcast: (tx: string) => Promise<string>;
  combine: (tx: string, signature: string, pubkey?: string) => string;
  estimateFees: (transactionIntent: TransactionIntent<TokenIdentifier>) => Promise<bigint>;
  craftTransaction: (transactionIntent: TransactionIntent<TokenIdentifier>) => Promise<string>;
  getBalance: (address: string) => Promise<Asset | bigint>;
  lastBlock: () => Promise<BlockInfo>;
  listOperations: (
    address: string,
    pagination: Pagination,
  ) => Promise<[Operation<TokenIdentifier>[], string]>;
};
