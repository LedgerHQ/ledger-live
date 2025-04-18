export type BlockInfo = {
  height: number;
  hash?: string;
  // can be different from tx date
  // transaction could be created at a particular moment, but depending on network conditions
  // mining time, and block intervals, it might not get included in the blockchain until later
  time?: Date;
};

type TokenInfoCommon = Record<string, unknown>;
// TODO add a `token: string` field to the pagination if we really need to support pagination (which is not the case for now)
export type Asset<TokenInfo extends TokenInfoCommon = never> =
  | { type: "native" }
  | (TokenInfo extends never ? TokenInfo : { type: "token" } & TokenInfo);

export type Operation<AssetInfo extends Asset<TokenInfoCommon>> = {
  type: string;
  // This operation corresponds to the index-th event triggered bu the original transaction
  operationIndex: number;
  senders: string[];
  recipients: string[];
  value: bigint;
  asset: AssetInfo;
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

export type Balance<AssetInfo extends Asset<TokenInfoCommon>> = {
  value: bigint;
  asset: AssetInfo;
};

export type TransactionIntent<
  AssetInfo extends Asset<TokenInfoCommon>,
  Extra = Record<string, unknown>,
  Sender extends Record<string, string> | string = string,
> = {
  type: string;
  sender: Sender;
  recipient: string;
  amount: bigint;
  asset: AssetInfo;
} & Extra;

export type FeeEstimation<FeeParameters extends Record<string, bigint> = never> = {
  value: bigint;
  parameters?: FeeParameters;
};

// TODO rename start to minHeight
//       and add a `token: string` field to the pagination if we really need to support pagination
//       (which is not the case for now)
//       for now start is used as a minHeight from which we want to fetch ALL operations
//       limit is unused for now
//       see design document at https://ledgerhq.atlassian.net/wiki/spaces/BE/pages/5446205788/coin-modules+lama-adapter+APIs+refinements
export type Pagination = { minHeight: number };
export type Api<
  AssetInfo extends Asset<TokenInfoCommon>,
  TxExtra = Record<string, unknown>,
  Sender extends Record<string, string> | string = string,
  FeeParameters extends Record<string, bigint> = never,
> = {
  broadcast: (tx: string) => Promise<string>;
  combine: (tx: string, signature: string, pubkey?: string) => string;
  estimateFees: (
    transactionIntent: TransactionIntent<AssetInfo, TxExtra, Sender>,
  ) => Promise<FeeEstimation<FeeParameters>>;
  craftTransaction: (
    transactionIntent: TransactionIntent<AssetInfo, TxExtra, Sender>,
    customFees?: bigint,
  ) => Promise<string>;
  getBalance: (address: string) => Promise<Balance<AssetInfo>[]>;
  lastBlock: () => Promise<BlockInfo>;
  listOperations: (
    address: string,
    pagination: Pagination,
  ) => Promise<[Operation<AssetInfo>[], string]>;
};
