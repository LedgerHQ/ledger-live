import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { BroadcastConfig, Operation as LiveOperation } from "@ledgerhq/types-live";

export type BlockInfo = {
  height: number;
  hash: string;
  // can be different from tx date
  // transaction could be created at a particular moment, but depending on network conditions
  // mining time, and block intervals, it might not get included in the blockchain until later
  time: Date;
  parent?: ParentBlock;
};

export type ParentBlock = Pick<BlockInfo, "height" | "hash">;

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
export type Block = {
  /** The block metadata. */
  info: BlockInfo;

  /**
   * The block transactions.
   *
   * It should include at least all transactions where an EOA is involved, however it is OK to ignore other types of
   * transactions that cannot cause balance changes (eg: validator vote transactions on Solana).
   */
  transactions: BlockTransaction[];
};

/**
 * A transaction belonging to a {@link Block}, not specific to a particular account/address.
 */
export type BlockTransaction = {
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
  operations: BlockOperation[];

  /** Network specific details for this transaction. */
  details?: Record<string, unknown>;

  /** The fee amount paid for this transaction, in base unit of the network native coin, always positive or zero.  */
  fees: bigint;

  /** The address that paid for this transaction's fees. */
  feesPayer: string;
};

/** An operation belonging to a {@link BlockTransaction}. */
export type BlockOperation = TransferBlockOperation | OtherBlockOperation;

/** An asset transfer that occurred in a {@link BlockTransaction}. */
export type TransferBlockOperation = {
  /** Operation type discriminator. */
  type: "transfer";

  /** The impacted address (can be sender or recipient based on signum of <code>amount</code>). */
  address: string;

  /** The peer participant in the transfer (optional as it may be not known). */
  peer?: string;

  /** The transferred asset. */
  asset: AssetInfo;

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

type MaybeMemo<MemoType extends Memo> = MemoType extends MemoNotSupported
  ? object
  : { memo: MemoType };

type MaybeTxData<TxDataType extends TxData> = TxDataType extends TxDataNotSupported
  ? object
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
  sponsored?: boolean;
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

/** A pagination cursor. */
export type Cursor = string;

/** A paginated response. */
export type Page<T> = {
  items: T[];
  next?: Cursor | undefined;
};

/** Options for {@link AlpacaApi#listOperations}. */
export type ListOperationsOptions = {
  /**
   * The minimum block height for which to fetch operations (inclusive).
   *
   * Implementation must raise a "not supported" error if `minHeight` is non-zero and not supported.
   */
  minHeight: number;

  /**
   * A pagination cursor to resume listing.
   *
   * Implementation must guarantee the cursor is not volatile, i.e. it can be used long after the last request and still
   * provide consistent results - for instance, a date or transaction hash.
   */
  cursor?: Cursor;

  /**
   * The maximum number of operations to fetch (note this is a soft limit, the implementation may return less or more
   * operations to not waste RPC calls).
   *
   * Implementation must raise a "not supported" error if limit is set and not supported.
   */
  limit?: number;

  /**
   * The chronological order of the operations (within one page as well as globally when concatenating all pages).
   *
   * Implementation must raise a "not supported" error if order is set and not supported.
   */
  order?: "asc" | "desc";
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

export type AddressValidationCurrencyParameters = {
  currency: CryptoCurrency;
  networkId: number;
};

export type AlpacaApi<
  MemoType extends Memo = MemoNotSupported,
  TxDataType extends TxData = TxDataNotSupported,
> = {
  // blockchain API

  /**
   * Get the latest block information from the network.
   *
   * This must return the same result as {@link getBlockInfo} for the latest block height.
   *
   * @returns the latest block metadata (height, hash, time)
   * @see getBlockInfo
   * @see getBlock
   */
  lastBlock: () => Promise<BlockInfo>;

  /**
   * Get block information for a specific block height.
   *
   * This must return the same result as {@link lastBlock} for the latest block height.
   *
   * This API is optional and may not be supported on all networks: implementation should raise a "not supported" error
   * in such case.
   *
   * @param height the block height to query
   * @returns the block metadata (height, hash, time)
   * @throws "not supported" if the blockchain does not support querying historical blocks
   */
  getBlockInfo: (height: number) => Promise<BlockInfo>;

  /**
   * Get a full block with all its transactions.
   *
   * This returns the complete block data including all transactions and their operations.
   *
   * This must return the same block info as {@link getBlockInfo} for the same height.
   *
   * This API is optional and may not be supported on all networks: implementation should raise a "not supported" error
   * in such case.
   *
   * @param height the block height to query
   * @returns the complete block with transactions
   * @throws "not supported" if the blockchain does not support querying full blocks
   */
  getBlock: (height: number) => Promise<Block>;

  /**
   * Get the list of validators available on the network.
   * @param cursor a pagination cursor to resume listing (the implementation must guarantee the cursor is not volatile,
   *         i.e. it can be used long after the last request and still provide consistent results - for instance,
   *         a date or transaction hash).
   *         The concrete implementation may return all validators in a single page when the underlying SDK
   *         does not provide cursor-based pagination.
   */
  getValidators: (cursor?: Cursor) => Promise<Page<Validator>>;

  // account read API

  /**
   * Get the balance(s) for an address/account.
   *
   * Returns all asset balances associated with the address, including the native asset and any tokens/sub-assets. Each
   * balance includes the total value and optionally locked/staked amounts.
   *
   * If account is not found, implementation must return an empty balance.
   *
   * @param address the account address
   * @returns an array of balances for all assets held by the address
   * @see getStakes
   * @see listOperations
   */
  getBalance: (address: string) => Promise<Balance[]>;

  /**
   * List operations for an address/account.
   *
   * If account is not found, implementation must return an empty result.
   *
   * @param address the owner account address
   * @param options see {@link ListOperationsOptions}
   * @returns a page of operations
   * @see getBalance
   */
  listOperations: (address: string, options: ListOperationsOptions) => Promise<Page<Operation>>;

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
   * @param cursor a pagination cursor to resume listing (the implementation must guarantee the cursor is not volatile,
   *               i.e. it can be used long after the last request and still provide consistent results - for instance,
   *               a date or transaction hash)
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

  // transaction API

  /**
   * Craft an unsigned transaction from a transaction intent.
   *
   * The crafted transaction is ready to be signed by the hardware wallet and then combined
   * with the signature using {@link combine}.
   *
   * @param transactionIntent the transaction intent describing what the user wants to do
   * @param customFees optional custom fees to use instead of the default estimation
   * @returns the crafted transaction with optional blockchain-specific details
   * @see craftRawTransaction
   */
  craftTransaction: (
    transactionIntent: TransactionIntent<MemoType, TxDataType>,
    customFees?: FeeEstimation,
  ) => Promise<CraftedTransaction>;

  /**
   * Craft an unsigned transaction from a raw/pre-built transaction.
   *
   * This is an alternative to {@link craftTransaction} for cases where the transaction
   * is already built externally (e.g., by a dApp or smart contract interaction).
   *
   * @param transaction the raw transaction to wrap/prepare for signing
   * @param sender the sender address
   * @param publicKey the sender's public key
   * @param sequence the account sequence/nonce (to prevent replay attacks)
   * @returns the crafted transaction ready for signing
   * @throws "not supported" if the blockchain does not support raw transaction crafting
   * @see craftTransaction
   */
  craftRawTransaction: (
    transaction: string,
    sender: string,
    publicKey: string,
    sequence: bigint,
  ) => Promise<CraftedTransaction>;

  /**
   * Estimate the fees for a transaction intent.
   *
   * The estimation should be based on current network conditions (e.g., gas price, fee rate).
   *
   * @param transactionIntent the transaction intent describing what the user wants to do
   * @param customFeesParameters optional blockchain-specific parameters to customize the fee estimation
   *        (e.g., gas limit, priority fee)
   * @returns the estimated fees and optional parameters that can be passed to {@link craftTransaction}
   */
  estimateFees: (
    transactionIntent: TransactionIntent<MemoType, TxDataType>,
    customFeesParameters?: FeeEstimation["parameters"],
  ) => Promise<FeeEstimation>;

  /**
   * Combine a crafted transaction with a signature to produce a signed transaction ready for broadcast.
   *
   * @param tx the unsigned/crafted transaction (as returned by {@link craftTransaction})
   * @param signature the signature produced by the hardware wallet
   * @param pubkey the public key used to sign (required for some blockchains to verify/embed in the transaction)
   * @returns the signed transaction ready for {@link broadcast}
   */
  combine: (tx: string, signature: string, pubkey?: string) => string | Promise<string>;

  /**
   * Broadcast a signed transaction to the network.
   *
   * @param tx the signed transaction (encoding is blockchain dependent, typically hex-encoded)
   * @param broadcastConfig optional configuration for the broadcast (e.g., retry settings)
   * @returns the transaction hash/digest once successfully submitted to the network
   * @throws if the transaction is rejected by the network (e.g., invalid signature, insufficient funds)
   */
  broadcast: (tx: string, broadcastConfig?: BroadcastConfig) => Promise<string>;
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
    balances: Balance[],
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
