export type BlockInfo = {
  height: number;
  hash?: string;
  // can be different from tx date
  // transaction could be created at a particular moment, but depending on network conditions
  // mining time, and block intervals, it might not get included in the blockchain until later
  time?: Date;
};

type TokenInfoCommon = Record<string, unknown>;
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
> = {
  type: string;
  sender: string;
  recipient: string;
  amount: bigint;
  asset: AssetInfo;
} & Extra;

/** A pagination cursor, represented as an opaque string. */
export type Cursor = string;

export type Api<AssetInfo extends Asset<TokenInfoCommon>> = {
  broadcast: (tx: string) => Promise<string>;
  combine: (tx: string, signature: string, pubkey?: string) => string;
  estimateFees: (transactionIntent: TransactionIntent<AssetInfo>) => Promise<bigint>;
  craftTransaction: (
    transactionIntent: TransactionIntent<AssetInfo>,
    customFees?: bigint,
  ) => Promise<string>;
  getBalance: (address: string) => Promise<Balance<AssetInfo>[]>;
  lastBlock: () => Promise<BlockInfo>;

  /**
   * List operations involving address.
   *
   * Operations are returned in descending order (from chain tip).
   *
   * Pagination uses a token, client should repeatedly call this API until no continuation token is provided anymore.
   * Pages can be of variable size and client should not rely on page size. Pagination tokens can be valid only for
   * a short timeframe and client is expected to fetch all pages as soon as possible to avoid consistency issues.
   *
   * @param address address
   * @param minHeight minimum block height (inclusive). if not specified, fetch all operations until genesis
   * @param cursor continuation token. if not specified, fetch first page of operations (from chain tip)
   * @returns a page of operations + next cursor when applicable
   */
  listOperations: (
    address: string,
    minHeight: number,
    cursor?: Cursor,
  ) => Promise<[Operation<AssetInfo>[], Cursor?]>;
};
