import { Unit } from "@ledgerhq/types-cryptoassets";

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

// Other coins take differents parameters What do we want to do ?
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

export type AlpacaApi<
  AssetInfo extends Asset<TokenInfoCommon>,
  MemoType extends Memo = MemoNotSupported,
> = {
  broadcast: (tx: string) => Promise<string>;
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
  listOperations: (
    address: string,
    pagination: Pagination,
  ) => Promise<[Operation<AssetInfo>[], string]>;
};

export type BridgeApi = {
  validateIntent: (account: Account, transaction: Transaction) => Promise<TransactionValidation>;
};

export type Api<
  AssetInfo extends Asset<TokenInfoCommon>,
  MemoType extends Memo = MemoNotSupported,
> = AlpacaApi<AssetInfo, MemoType> & BridgeApi;
