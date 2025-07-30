import { Unit } from "@ledgerhq/types-cryptoassets";
import { BroadcastConfig } from "@ledgerhq/types-live";

export type BlockInfo = {
  height: number;
  hash?: string;
  // can be different from tx date
  // transaction could be created at a particular moment, but depending on network conditions
  // mining time, and block intervals, it might not get included in the blockchain until later
  time?: Date;
  parent?: BlockInfo;
};

type TokenInfoCommon = Record<string, unknown>;
// TODO add a `token: string` field to the pagination if we really need to support pagination (which is not the case for now)
export type Asset<TokenInfo extends TokenInfoCommon = never> =
  | { type: "native" }
  | (TokenInfo extends never ? TokenInfo : { type: "token" } & TokenInfo);

export type Operation<
  AssetInfo extends Asset<TokenInfoCommon> = Asset<TokenInfoCommon>,
  MemoType extends Memo = MemoNotSupported,
> = {
  id: string;
  type: string;

  senders: string[];
  recipients: string[];

  value: bigint;
  asset: AssetInfo;

  /**
   * Optional memo associated with the operation.
   * Use a `Memo` interface like `StringMemo<"text">`, `MapMemo<Kind, Value>`, or `MyMemo`.
   * Defaults to `MemoNotSupported`.
   */
  memo?: MemoType;

  /**
   * Arbitrary per-blockchain extra fields.
   * This can include things like status, error messages, swap info, etc.
   */
  details?: Record<string, unknown>;

  tx: {
    hash: string; // transaction hash
    block: BlockInfo; // block metadata
    fees: bigint; // network fees paid
    date: Date; // tx date (may differ from block time)
  };
};

export type Transaction = {
  type: string;
  recipient: string;
  amount: bigint;
  fee: bigint;
} & Record<string, unknown>; // Field containing dedicated value for each blockchain

/**
 * A block along with its {@link BlockTransaction}, not specific to a particular account/address.
 */
export type Block<AssetType extends Asset<TokenInfoCommon>> = {
  /** The block metadata. */
  info: BlockInfo;

  /**
   * The block transactions.
   *
   * It should include at least all transactions where an EOA is involved, however it is OK to ignore other types of
   * transactions that cannot cause balance changes (eg: validator vote transactions on Solana).
   */
  transactions: BlockTransaction<AssetType>[];
};

/**
 * A transaction belonging to a {@link Block}, not specific to a particular account/address.
 */
export type BlockTransaction<AssetType extends Asset<TokenInfoCommon>> = {
  /** The transaction hash/digest (globally unique identifier). */
  hash: string;

  /** If the transaction has been failed, fees have been paid but other balance changes are not effective.*/
  failed: boolean;

  /**
   * The operations/instructions included in this transaction.
   *
   * It should include at least all operations where an EOA is involved, however it is OK to ignore other types of
   * operations that cannot cause balance changes (eg: validator vote instructions on Solana).
   *
   * Note that fees are accounted for separately, so operations must not represent fees.
   */
  operations: BlockOperation<AssetType>[];

  /** Network specific details for this transaction. */
  details?: Record<string, unknown>;

  /** The fee amount paid for this transaction, in base unit of the network native coin, always positive or zero.  */
  fees: bigint;

  /** The address that paid for this transaction's fees. */
  feesPayer: string;
};

/** An operation belonging to a {@link BlockTransaction}. */
export type BlockOperation<AssetType extends Asset<TokenInfoCommon>> =
  | TransferBlockOperation<AssetType>
  | OtherBlockOperation;

/** A asset transfer that occurred in a {@link BlockTransaction}. */
export type TransferBlockOperation<AssetType extends Asset<TokenInfoCommon>> = {
  /** Operation type discriminator. */
  type: "transfer";

  /** The impacted address (can be sender or recipient based on signum of <code>amount</code>}. */
  address: string;

  /** The peer participant in the transfer (optional as it may be not known). */
  peer?: string;

  /** The transferred asset. */
  asset: AssetType;

  /**
   * The signed amount of the transfer, i.e. impact of the transfer on <code>address</code> balance (positive for
   * incoming, negative for outgoing).
   */
  amount: bigint;
};

/**
 * An unclassified type of operation that occurred in a {@link BlockTransaction}.
 *
 * Implementations are free to partially/completely omit this kind of operations.
 */
export type OtherBlockOperation = {
  type: "other";
} & Record<string, unknown>;

// Other coins take different parameters What do we want to do ?
export type Account = {
  currencyName: string;
  address: string;
  balance: bigint;
  currencyUnit: Unit;
};

export type Balance<AssetInfo extends Asset<TokenInfoCommon>> = {
  value: bigint;
  locked?: bigint;
  asset: AssetInfo;
};

export interface Memo {
  type: string;
}

// generic implementations that cover many coins (in coin-framework)
export interface MemoNotSupported extends Memo {
  type: "none";
}

// Specialized version, not extending the above
export interface StringMemo<Kind extends string = "text"> extends Memo {
  type: "string";
  kind: Kind;
  value: string;
}

export interface MapMemo<Kind extends string, Value> extends Memo {
  type: "map";
  memos: Map<Kind, Value>;
}

export interface TypedMapMemo<KindToValueMap extends Record<string, unknown>> extends Memo {
  type: "map";
  memos: Map<keyof KindToValueMap, KindToValueMap[keyof KindToValueMap]>;
}

// FIXME: find better maybeMemo type without disabling the rule
// eslint-disable-next-line @typescript-eslint/ban-types
type MaybeMemo<MemoType extends Memo> = MemoType extends MemoNotSupported ? {} : { memo: MemoType };

export type FeesStrategy = "slow" | "medium" | "fast";

export type TransactionIntent<
  AssetInfo extends Asset<TokenInfoCommon>,
  MemoType extends Memo = MemoNotSupported,
> = {
  type: string;
  sender: string;
  senderPublicKey?: string;
  expiration?: number;
  recipient: string;
  amount: bigint;
  asset: AssetInfo;
  sequence?: number;
  feesStrategy?: FeesStrategy;
} & MaybeMemo<MemoType>;

export type TransactionValidation = {
  errors: Record<string, Error>;
  warnings: Record<string, Error>;
  estimatedFees: bigint;
  amount: bigint;
  totalSpent: bigint;
};

export type FeeEstimation = {
  value: bigint;
  parameters?: {
    storageLimit: bigint;
    gasLimit: bigint;
    // Optional gas price, only for Aptos (need to improve)
    gasPrice?: bigint;
  };
};

// TODO rename start to minHeight
//       and add a `token: string` field to the pagination if we really need to support pagination
//       (which is not the case for now)
//       for now start is used as a minHeight from which we want to fetch ALL operations
//       limit is unused for now
//       see design document at https://ledgerhq.atlassian.net/wiki/spaces/BE/pages/5446205788/coin-modules+lama-adapter+APIs+refinements
export type Pagination = { minHeight: number };

export type AccountInfo = {
  isNewAccount: boolean;
  balance: string;
  ownerCount: number;
  sequence: number;
};

export type AlpacaApi<
  AssetInfo extends Asset<TokenInfoCommon>,
  MemoType extends Memo = MemoNotSupported,
> = {
  broadcast: (tx: string, broadcastConfig?: BroadcastConfig) => Promise<string>;
  combine: (tx: string, signature: string, pubkey?: string) => string | Promise<string>;
  estimateFees: (
    transactionIntent: TransactionIntent<AssetInfo, MemoType>,
  ) => Promise<FeeEstimation>;
  craftTransaction: (
    transactionIntent: TransactionIntent<AssetInfo, MemoType>,
    customFees?: bigint,
  ) => Promise<string>;
  getBalance: (address: string) => Promise<Balance<AssetInfo>[]>;
  lastBlock: () => Promise<BlockInfo>;
  getBlockInfo: (height: number) => Promise<BlockInfo>;
  getBlock: (height: number) => Promise<Block<AssetInfo>>;
  listOperations: (
    address: string,
    pagination: Pagination,
  ) => Promise<[Operation<AssetInfo>[], string]>;
};

export type BridgeApi = {
  validateIntent: (account: Account, transaction: Transaction) => Promise<TransactionValidation>;
  // TODO: make it available on alpacaApi
  getAccountInfo: (address: string) => Promise<AccountInfo>;
};

export type Api<
  AssetInfo extends Asset<TokenInfoCommon>,
  MemoType extends Memo = MemoNotSupported,
> = AlpacaApi<AssetInfo, MemoType> & BridgeApi;
