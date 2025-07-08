import { Unit } from "@ledgerhq/types-cryptoassets";
import { BroadcastConfig } from "@ledgerhq/types-live";
import { TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

export type BlockInfo = {
  height: number;
  hash?: string;
  // can be different from tx date
  // transaction could be created at a particular moment, but depending on network conditions
  // mining time, and block intervals, it might not get included in the blockchain until later
  time?: Date;
};

export type TokenStandard =
  | "token"
  | "coin" // Aptos native token type
  | "fungible_asset" // Aptos FA standard
  | "trc10"
  | "trc20"
  | "erc20"
  | "erc721"
  | "erc1155";
// | string;              // for future extension (e.g., sui, custom, etc.)

export type AssetInfo =
  | { type: "native" }
  | {
      type: TokenStandard;
      assetReference?: string; // contract address (trc20), tokenId (trc10),, etc
      assetOwner?: string;
      //   selling_liabilities?: string; //FIXME: used for stellar need to be remove from here
      // balance?: string; //FIXME: used for stellar need to be remove from here
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
  };
};

export type Transaction = {
  type: string;
  recipient: string;
  amount: bigint;
  fee: bigint;
  // baseReserve?: bigint; // NOTE: used for changeTrust mode in stellar
  // networkInfo?: {
  //   baseFee?: bigint;
  //   fees?: bigint;
  // };
} & Record<string, unknown>; // Field containing dedicated value for each blockchain

// Other coins take differents parameters What do we want to do ?
export type Account = {
  currencyName: string;
  address: string;
  balance: bigint;
  currencyUnit: Unit;
  // pendingOperations: number; // NOTE: can get away with only the number of pending operations?
  spendableBalance: bigint; // NOTE:: check if we can get rid of this one
  // subAccount?: TokenAccount;
};

export type Balance = {
  value: bigint;
  locked?: bigint;
  asset: AssetInfo;
  spendableBalance: bigint;
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

export type TransactionIntent<MemoType extends Memo = MemoNotSupported> = {
  type: string;
  sender: string;
  senderPublicKey?: string;
  expiration?: number;
  recipient: string;
  amount: bigint;
  fees?: bigint | null | undefined; // Optional, depending on the API
  useAllAmount?: boolean; // FIXME: might be better to live inside generic-adapter?
  asset: AssetInfo;
  sequence?: number;
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
export type Pagination = { minHeight: number } & { pagingToken?: string; limit?: number }; // For evm, XRP, etc. // NOTE: For Stellar
// NOTE: future proof export type Pagination = Record<string, unknown>;

export type AccountInfo = {
  isNewAccount: boolean;
  balance: string;
  ownerCount: number;
  sequence: number;
  assets?: AssetInfo[]; // BalanceAsset[]; // Optional, depending on the API
  spendableBalance?: string; // Optional, depending on the API
};

export type AlpacaApi<MemoType extends Memo = MemoNotSupported> = {
  broadcast: (tx: string, broadcastConfig?: BroadcastConfig) => Promise<string>;
  combine: (tx: string, signature: string, pubkey?: string) => string | Promise<string>;
  estimateFees: (transactionIntent: TransactionIntent<MemoType>) => Promise<FeeEstimation>;
  craftTransaction: (
    transactionIntent: TransactionIntent<MemoType>,
    customFees?: bigint,
  ) => Promise<string>;
  getBalance: (address: string) => Promise<Balance[]>;
  lastBlock: () => Promise<BlockInfo>;
  // NOTE: listPagingToken missing in Pagination?
  listOperations: (address: string, pagination: Pagination) => Promise<[Operation[], string]>;
};

export type BridgeApi<MemoType extends Memo = MemoNotSupported> = {
  // FIXME: single param -> transactionIntent
  validateIntent: (
    transactionIntent: TransactionIntent<MemoType>,
  ) => Promise<TransactionValidation>;
  // TODO: make it available on alpacaApi
  // getAccountInfo: (address: string) => Promise<AccountInfo>;
  getSequence: (address: string) => Promise<number>;
  // getSpendableBalance?: (address: string) => Promise<string>;
  // getAssets: (address: string) => Promise<AssetInfo[]>; // NOTE: or BalanceAsset[];
};

export type Api<MemoType extends Memo = MemoNotSupported> = AlpacaApi<MemoType> &
  BridgeApi<MemoType>;
