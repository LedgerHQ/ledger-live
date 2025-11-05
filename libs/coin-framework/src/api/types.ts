import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { BroadcastConfig, Operation as LiveOperation } from "@ledgerhq/types-live";

export type BlockInfo = {
  height: number;
  hash?: string;
  // can be different from tx date
  // transaction could be created at a particular moment, but depending on network conditions
  // mining time, and block intervals, it might not get included in the blockchain until later
  time?: Date;
  parent?: BlockInfo;
};

// NOTE: from crypto-asset
export type Unit = {
  // display name of a given unit (example: satoshi)
  name: string;
  // string to use when formatting the unit. like 'BTC' or 'USD'
  code: string;
  // number of digits after the '.'
  magnitude: number;
  // should it always print all digits even if they are 0 (usually: true for fiats, false for cryptos)
  showAllDigits?: boolean;
  // true if the code should prefix amount when formatting
  prefixCode?: boolean;
};

export type AssetInfo =
  | { type: "native"; name?: string; unit?: Unit }
  | {
      type: string; // token, coin, fungible_asset, trc10, trc20, erc20, erc721, erc1155, etc.
      assetReference?: string; // contract address (trc20), tokenId (trc10),, etc
      assetOwner?: string;
      name?: string; // e.g., token name, or asset name
      unit?: Unit;
    };

// NOTE: CoreOperation
export type Operation<MemoType extends Memo = MemoNotSupported> = {
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
  assetInfo?: AssetInfo;
  tx: {
    hash: string; // transaction hash
    block: BlockInfo; // block metadata
    fees: bigint; // network fees paid
    date: Date; // tx date (may differ from block time)

    /** If the transaction has failed, fees have been paid but other balance changes are not effective.*/
    failed: boolean;
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
export type Block<MemoType extends Memo = MemoNotSupported> = {
  /** The block metadata. */
  info: BlockInfo;

  /**
   * The block transactions.
   *
   * It should include at least all transactions where an EOA is involved, however it is OK to ignore other types of
   * transactions that cannot cause balance changes (eg: validator vote transactions on Solana).
   */
  transactions: BlockTransaction<MemoType>[];
};

/** A transaction returned by {@link AlpacaApi#getBlock}. */
export type BlockTransaction<MemoType extends Memo = MemoNotSupported> = {
  /** The transaction globally unique identifier (typically hash/digest). */
  id: string;

  /** Transaction date. */
  time?: Date;

  /**
   * Indicates the transaction has been published in a block, but its instructions have not been executed.
   *
   * If failed, only events with type <code>FEE</code> have been executed. All other event types should be ignored when
   * computing balances.
   */
  failed: boolean;

  /**
   * Optional memo associated with the operation.
   * Use a `Memo` interface like `StringMemo<"text">`, `MapMemo<Kind, Value>`, or `MyMemo`.
   * Defaults to `MemoNotSupported`.
   */
  memo?: MemoType;

  /**
   * The operations/instructions included in this transaction.
   *
   * It must include at least all events that caused a balance change. Ignoring other events or not is implementation
   * specific.
   */
  events: TransactionEvent[];

  /** Network specific details for this transaction. */
  details?: Record<string, unknown>;
};

/** A transaction returned by {@link AlpacaApi#getTransactions}. */
export type AccountTransaction<MemoType extends Memo = MemoNotSupported> =
  BlockTransaction<MemoType> & {
    /** The block metadata. */
    block: BlockInfo;
  };

/**
 * An event that occurred as part of a {@link Transaction}.
 *
 * Definition of transaction events is blockchain dependent, it could be based on either:
 *  - transaction operations in the technical sense (eg: "1 instruction == 1 event" on Solana)
 *  - transaction operations in the functional sense (eg: "create staking account" on Solana, which involves several
 *    instructions)
 *
 * Similarly, since each event can contain multiple balance deltas, some transactions can be represented in several ways.
 * For instance, a batch transfer can be represented as:
 *  - 1 event with N balance deltas
 *  - N events with 1 balance delta
 *
 * Another example is UTXO based chains, either:
 *  - 1 event per input or output: this allows providing details of each UTXO being spent
 *  - 1 event per transaction: in this case, balance deltas would be aggregated
 *
 * The implementation guideline is to:
 *  - use the most concise representation of the transaction: for instance, in a batch transfer, if it makes no sense to
 *    attach metadata to each balance delta, then using a single event with N balance deltas is preferable.
 *  - do not loose information: in the batch transfer example, if each balance delta has a specific operation identifier,
 *    then it makes more sense using N events.
 */
export type TransactionEvent = {
  /** The event classification.*/
  type: TransactionEventType;

  /** Balance deltas caused by this event, if any. */
  balanceDeltas: BalanceDelta[];

  /** Network specific details for this event. */
  details?: Record<string, unknown>;
};

export type TransactionEventType =
  // COMMON
  | "UNKNOWN" // default/fallback
  | "TRANSFER" // default type for send/receive
  | "FEE" // fee payment
  | "CREATE"
  | "REVEAL"
  // COSMOS
  | "DELEGATE"
  | "UNDELEGATE"
  | "REDELEGATE"
  | "REWARD"
  // TRON
  | "FEES"
  | "FREEZE"
  | "UNFREEZE"
  | "WITHDRAW_EXPIRE_UNFREEZE"
  | "UNDELEGATE_RESOURCE"
  | "LEGACY_UNFREEZE"
  // POLKADOT
  | "VOTE"
  | "REWARD_PAYOUT"
  | "BOND"
  | "UNBOND"
  | "WITHDRAW_UNBONDED"
  | "SET_CONTROLLER"
  | "SLASH"
  | "NOMINATE"
  | "CHILL"
  // ETHEREUM
  | "APPROVE"
  // ALGORAND
  | "OPT_IN"
  | "OPT_OUT"
  // CELO
  | "LOCK"
  | "UNLOCK"
  | "WITHDRAW"
  | "REVOKE"
  | "ACTIVATE"
  | "REGISTER"
  // NFT
  | "NFT_IN"
  | "NFT_OUT"
  // NEAR
  | "STAKE"
  | "UNSTAKE"
  | "WITHDRAW_UNSTAKED"
  // SOLANA
  | "BURN"
  // HEDERA
  | "ASSOCIATE_TOKEN"
  // CANTON
  | "PRE_APPROVAL";

/**
 * A change on an address balance that occurred as part of a {@link TransactionEvent}.
 *
 * A simple transfer can be represented by two symmetrical {@link BalanceDelta}.
 */
export type BalanceDelta = {
  /** The impacted address (can be sender or recipient based on signum of <code>amount</code>). */
  address: string;

  /** The address of the peer participant in the transfer (optional as it may not always be known). */
  peer?: string;

  /** The transferred asset. */
  asset: AssetInfo;

  /**
   * The signed amount of the balance change, i.e. impact of the event on <code>address</code> balance (positive for
   * incoming, negative for outgoing), in base unit of {@link asset}.
   */
  delta: bigint;
};

// Other coins take different parameters What do we want to do ?
export type Account = {
  currencyName: string;
  address: string;
  balance: bigint;
  currencyUnit: Unit;
  spendableBalance: bigint; // NOTE:: check if we can get rid of this one
};

/**
 * A component of an account/address balance, for a single asset.
 *
 * @see AlpacaApi#getBalance
 */
export type Balance = {
  /** The balance value, in base unit of {@link asset} (always positive). */
  value: bigint;

  /** The balance asset. */
  asset: AssetInfo;

  /** The non-spendable part of {@link value} (eg: minimum balance requirement, or reserved for rent). */
  locked?: bigint;

  /** The {@link Stake} this balance is part of, if any. */
  stake?: Stake;
};

/** The state of a {@link Stake}. */
export type StakeState =
  | "inactive" // stake has been created/funded, but not collecting any rewards for any reason
  | "activating" // stake has been created/funded, and will start collecting rewards on next "epoch" (protocol specific)
  | "active" // stake is initialized and collecting rewards
  | "deactivating"; // stake has been deactivated, will be withdrawable/spendable yet on next "epoch" (protocol specific)

/**
 * A staking position, for a single address/asset/state.
 *
 * Note that on blockchains that allow heterogeneous assets/states in a single account, a staking account is represented
 * as several {@link Stake}.
 *
 * @see Reward
 * @see AlpacaApi#getStakes
 */
export type Stake = {
  /** An immutable, globally unique id of the stake. Depending on the blockchain, it could simply be the account address,
   * or a synthetic identifier. */
  uid: string;

  /** The owning account address. Depending on the blockchain, it can be the staking account address or directly the
   * main one. */
  address: string;

  /** The validator/staking pool/delegate address. */
  delegate?: string;

  /** The stake status, see {@link StakeState}. */
  state: StakeState;

  /** UTC date of last state change. */
  stateUpdatedAt?: Date;

  /** UTC date of initial stake creation. */
  createdAt?: Date;

  /** The staked asset. */
  asset: AssetInfo;

  /** The amount owned by the stake, in base unit of {@link asset} (deposits + rewards). */
  amount: bigint;

  /** The part of {@link amount} that was deposited (<code>amount = amount_deposited + amount_rewarded</code>). */
  amountDeposited?: bigint;

  /** The part of {@link amount} that was rewarded (<code>amount = amount_deposited + amount_rewarded</code>). */
  amountRewarded?: bigint;

  /** A free form map of network specific fields. */
  details?: Record<string, unknown>;
};

/**
 * A staking reward distribution event.
 *
 * @see Stake
 * @see AlpacaApi#getRewards
 */
export type Reward = {
  /** {@link Stake#uid} via which this reward was obtained. */
  stake: string;

  /** The reward asset. */
  asset: AssetInfo;

  /** The reward amount. */
  amount: bigint;

  /** UTC date at which reward was effectively credited to the account (not emitted). */
  receivedAt: Date;

  /** If applicable, the transaction hash that distributed the reward. */
  transactionHash?: string;

  /** A free form map of network specific fields. */
  details?: Record<string, unknown>;
};

/**
 * Computational payload processed by Blockchains, such as
 * calldata on EVM or instruction data on Solana
 */
export interface TxData {
  type: string;
}

/**
 * Default implementation when no computational payload is supported
 * by the underlying Blockchain
 */
export interface TxDataNotSupported extends TxData {
  type: "none";
}

/**
 * Implementation with bufferized computational payload
 */
export interface BufferTxData extends TxData {
  type: "buffer";
  value: Buffer;
}

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
  type: string;
  memos: Map<Kind, Value>;
}

export interface TypedMapMemo<KindToValueMap extends Record<string, unknown>> extends Memo {
  type: string;
  memos: Map<keyof KindToValueMap, KindToValueMap[keyof KindToValueMap]>;
}

// FIXME: find better maybeMemo type without disabling the rule
// eslint-disable-next-line @typescript-eslint/ban-types
type MaybeMemo<MemoType extends Memo> = MemoType extends MemoNotSupported ? {} : { memo: MemoType };

type MaybeTxData<TxDataType extends TxData> = TxDataType extends TxDataNotSupported
  ? // eslint-disable-next-line @typescript-eslint/ban-types
    {}
  : { data: TxDataType };

export type FeesStrategy = "slow" | "medium" | "fast" | "custom";

export type StakingOperation = "delegate" | "undelegate" | "redelegate";

export type TransactionIntent<
  MemoType extends Memo = MemoNotSupported,
  TxDataType extends TxData = TxDataNotSupported,
> = {
  intentType: "transaction" | "staking";
  type: string;
  sender: string;
  recipient: string;
  amount: bigint;
  asset: AssetInfo;
  useAllAmount?: boolean;
  feesStrategy?: FeesStrategy;
  senderPublicKey?: string;
  sequence?: bigint;
  expiration?: number;
} & MaybeMemo<MemoType> &
  MaybeTxData<TxDataType>;

export type StakingTransactionIntent<
  MemoType extends Memo = MemoNotSupported,
  TxDataType extends TxData = TxDataNotSupported,
> = TransactionIntent & {
  intentType: "staking";
  mode: StakingOperation;
  valAddress: string;
  dstValAddress?: string;
} & MaybeMemo<MemoType> &
  MaybeTxData<TxDataType>;

export type SendTransactionIntent<
  MemoType extends Memo = MemoNotSupported,
  TxDataType extends TxData = TxDataNotSupported,
> = TransactionIntent & {
  intentType: "transaction";
} & MaybeMemo<MemoType> &
  MaybeTxData<TxDataType>;

export type TransactionValidation = {
  errors: Record<string, Error>;
  warnings: Record<string, Error>;
  estimatedFees: bigint;
  totalFees?: bigint;
  amount: bigint;
  totalSpent: bigint;
};

export type FeeEstimation = {
  value: bigint;
  parameters?: Record<string, unknown>;
};

/** Response of {@link AlpacaApi#craftTransaction}. */
export type CraftedTransaction = {
  /** The serialized transaction (encoding is blockchain dependent). */
  transaction: string;
  /** Blockchain specific details (eg: UTXOs referenced in the transaction). */
  details?: Record<string, unknown>;
};

// TODO rename start to minHeight
//       and add a `token: string` field to the pagination if we really need to support pagination
//       (which is not the case for now)
//       for now start is used as a minHeight from which we want to fetch ALL operations
//       limit is unused for now
//       see design document at https://ledgerhq.atlassian.net/wiki/spaces/BE/pages/5446205788/coin-modules+lama-adapter+APIs+refinements
// Future-proof pagination type as suggested in the comment
export type Pagination = {
  minHeight: number;
  lastPagingToken?: string;
  pagingToken?: string;
  limit?: number;
  order?: "asc" | "desc";
};
// NOTE: future proof export type Pagination = Record<string, unknown>;
/** A pagination cursor. */
export type Cursor = string;
export type Direction = "asc" | "desc";

/** A paginated response. */
export type Page<T> = {
  items: T[];
  next?: Cursor | undefined;
};

/** A network validator */
export type Validator = {
  /** Address of the validator. */
  address: string;

  /** Human-readable name of the validator. */
  name: string;

  /** Human-readable description of the validator. */
  description?: string | undefined;

  /** URL of the entity running the validator. */
  url?: string | undefined;

  /** URL of the logo for the validator. */
  logo?: string | undefined;

  /** Amount of native asset in the pool (in base unit of chain native currency). */
  balance?: bigint | undefined;

  /** Validator commission (a bigint serialized as a string). */
  commissionRate?: string | undefined;

  /** Validator Annual Percentage Yield (floating point number between 0 and 1). */
  apy?: number | undefined;
};

export type AccountInfo = {
  isNewAccount: boolean;
  balance: string;
  ownerCount: number;
  sequence: number;
};
// NOTE: future proof export type Pagination = Record<string, unknown>;

export type AlpacaApi<
  MemoType extends Memo = MemoNotSupported,
  TxDataType extends TxData = TxDataNotSupported,
> = {
  broadcast: (tx: string, broadcastConfig?: BroadcastConfig) => Promise<string>;
  combine: (tx: string, signature: string, pubkey?: string) => string | Promise<string>;
  estimateFees: (
    transactionIntent: TransactionIntent<MemoType, TxDataType>,
    customFeesParameters?: FeeEstimation["parameters"],
  ) => Promise<FeeEstimation>;
  craftTransaction: (
    transactionIntent: TransactionIntent<MemoType, TxDataType>,
    customFees?: FeeEstimation,
  ) => Promise<CraftedTransaction>;
  craftRawTransaction: (
    transaction: string,
    sender: string,
    publicKey: string,
    sequence: bigint,
  ) => Promise<CraftedTransaction>;
  getBalance: (address: string) => Promise<Balance[]>;
  lastBlock: () => Promise<BlockInfo>;
  getBlockInfo: (height: number) => Promise<BlockInfo>;
  getBlock: (height: number) => Promise<Block<MemoType>>;
  listOperations: (address: string, pagination: Pagination) => Promise<[Operation[], string]>;

  /**
   * Get transactions where a specific address is involved.
   *
   * This must include all transactions where the address has at least one {@link BalanceDelta}. Depending on blockchain
   * specifics, this can also include other transactions where address is involved (eg: as a signer or observer).
   *
   * Implementation must only return transactions included in a block, and not pending transactions.
   *
   * Results should be immutable, i.e. two calls with the same parameters should return the same results, with the
   * exception of block reorganizations: it is caller's responsibility to handle this case (by re-fetching recent
   * transactions according to a confirmation threshold). Apart from that, implementation must guarantee immutable
   * responses, and for instance raise an error if an API is unavailable rather that returning partial results.
   *
   * @param address address to get transactions for
   * @param direction order of transactions to return, either ascending or descending. Default direction order is
   *        implementation dependent, caller must specify the parameter if it matters. Implementation must throw an
   *        error if the direction is not supported.
   * @param minHeight minimum block height to include transactions from (inclusive). Implementation must throw an
   *        error if filtering by minimum height is not supported.
   * @param maxHeight maximum block height to include transactions from (inclusive). Implementation must throw an
   *        error if filtering by maximum height is not supported.
   * @param cursor a pagination cursor to resume listing (the implementation must guarantee the cursor is not volatile,
   *               i.e. it can be used long after the last request and still provide consistent results - for instance,
   *               a date or transaction hash)
   * @returns a page of transactions
   */
  getTransactions: (
    address: string,
    direction?: Direction,
    minHeight?: number,
    maxHeight?: number,
    cursor?: Cursor,
  ) => Promise<Page<AccountTransaction<MemoType>>>;

  /**
   * Get staking positions owned by an address/account.
   *
   * Results are returned in no particular order, in pages that can be of variable size. Page size is controlled by
   * implementation and should minimize number of RPC calls (typically by aligning with SDK/RPC API pages).
   *
   * Results could include closed/deleted staking positions, this is implementation dependent.
   *
   * Since this API can make no sense/be complex to implement/require too many RPC calls on some blockchains, it is
   * optional: implementation should raise a "not supported" error in such case.
   *
   * @param address the owner account address
   * @see getBalance
   * @see getRewards
   */
  getStakes: (address: string, cursor?: Cursor) => Promise<Page<Stake>>;

  /**
   * Get staking reward distribution events since address/account inception.
   *
   * Results are returned in ascending chronological order, in pages that can be of variable size. Page size is
   * controlled by implementation and should minimize number of RPC calls (typically by aligning with SDK/RPC API pages).
   *
   * Note that since staking implementations vary from one blockchain to another, some points are implementation dependent:
   *   - depending on the blockchain account model, the exact meaning of <code>address</code> can be:
   *      - a parent account => history will include all staking subaccounts
   *      - a single staking position/subaccount address
   *   - depending on the reward distribution mechanisms, reward events can be transactions, or blocks/epochs, or
   *     generated synthetically (eg: daily)
   *
   * Since this API can make no sense/be complex to implement/require too many RPC calls on some blockchains, it is
   * optional: implementation should raise a "not supported" error in such case.
   *
   * @param address the account address (see doc, exact scope of the request is implementation dependent)
   * @param cursor a pagination cursor to resume listing (the implementation must guarantee the cursor is not volatile,
   *               i.e. it can be used long after the last request and still provide consistent results - for instance,
   *               a date or transaction hash)
   * @see getBalance
   * @see getStakes
   */
  getRewards: (address: string, cursor?: Cursor) => Promise<Page<Reward>>;

  /**
   * Get the list of validators available on the network.
   *
   * @param cursor a pagination cursor to resume listing (the implementation must guarantee the cursor is not volatile,
   *         i.e. it can be used long after the last request and still provide consistent results - for instance,
   *         a date or transaction hash).
   *         The concrete implementation may return all validators in a single page when the underlying SDK
   *         does not provide cursor-based pagination.
   */
  getValidators: (cursor?: Cursor) => Promise<Page<Validator>>;
};

export type ChainSpecificRules = {
  getAccountShape: (address: string) => void;
  getTransactionStatus: {
    throwIfPendingOperation?: boolean;
  };
};

export type BridgeApi<
  MemoType extends Memo = MemoNotSupported,
  TxDataType extends TxData = TxDataNotSupported,
> = {
  validateIntent: (
    transactionIntent: TransactionIntent<MemoType, TxDataType>,
    customFees?: FeeEstimation,
  ) => Promise<TransactionValidation>;
  getSequence: (address: string) => Promise<bigint>;
  getChainSpecificRules?: () => ChainSpecificRules;
  getTokenFromAsset?: (asset: AssetInfo) => Promise<TokenCurrency | undefined>;
  getAssetFromToken?: (token: TokenCurrency, owner: string) => AssetInfo;
  computeIntentType?: (transaction: Record<string, unknown>) => string;
  refreshOperations?: (operations: LiveOperation[]) => Promise<LiveOperation[]>;
};

export type Api<
  MemoType extends Memo = MemoNotSupported,
  TxDataType extends TxData = TxDataNotSupported,
> = AlpacaApi<MemoType, TxDataType> & BridgeApi<MemoType, TxDataType>;
