import { Unit } from "@ledgerhq/types-cryptoassets";
import { TransactionCommon } from "@ledgerhq/types-live";

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
  AssetInfo extends Asset<TokenInfoCommon>,
  MemoKind = never,
  MemoValue = never,
> = {
  id: string;
  type: string;
  senders: string[];
  recipients: string[];
  value: bigint;
  asset: AssetInfo;
  memo?: {
    type: MemoKind;
    value: MemoValue;
  };
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

export type Account = {
  currencyName: string;
  address: string;
  balance: bigint;
  currencyUnit: Unit;
} & Record<string, unknown>;
// TODO: more descriptive / errors? if entering a wrong field

export type Balance<AssetInfo extends Asset<TokenInfoCommon>> = {
  value: bigint;
  locked?: bigint;
  asset: AssetInfo;
};

export type TransactionIntent<
  AssetInfo extends Asset<TokenInfoCommon>,
  MemoKinds = never,
  MemoValue = never,
> = {
  type: string;
  sender: string;
  senderPublicKey?: string;
  expiration?: number;
  recipient: string;
  amount: bigint;
  asset: AssetInfo;
  memos?: { type: MemoKinds; value: MemoValue }[];
};

export type TransactionValidation = {
  errors: Record<string, Error>;
  warnings: Record<string, Error>;
  estimatedFees: bigint;
  amount: bigint;
  totalSpent: bigint;
};

export type FeeEstimation<> = {
  value: bigint;
  // parameters?: FeeParameters;
  parameters?: {
    storageLimit: bigint;
    gasLimit: bigint;
  };
};

// TODO rename start to minHeight
//       and add a `token: string` field to the pagination if we really need to support pagination
//       (which is not the case for now)
//       for now start is used as a minHeight from which we want to fetch ALL operations
//       limit is unused for now
//       see design document at https://ledgerhq.atlassian.net/wiki/spaces/BE/pages/5446205788/coin-modules+lama-adapter+APIs+refinements
export type Pagination = { minHeight: number };

export type PreSignOperationHook = (opts: { transaction: TransactionCommon }) => void;

export type Api<AssetInfo extends Asset<TokenInfoCommon>, MemoKind = never, MemoValue = string> = {
  broadcast: (tx: string) => Promise<string>;
  combine: (tx: string, signature: string, pubkey?: string) => string | Promise<string>;
  estimateFees: (
    transactionIntent: TransactionIntent<AssetInfo, MemoKind, MemoValue>,
  ) => Promise<FeeEstimation>;
  craftTransaction: (
    transactionIntent: TransactionIntent<AssetInfo, MemoKind, MemoValue>,
    customFees?: bigint,
  ) => Promise<string>;
  validateIntent?: (account: Account, transaction: Transaction) => Promise<TransactionValidation>;
  getBalance: (address: string) => Promise<Balance<AssetInfo>[]>;
  lastBlock: () => Promise<BlockInfo>;
  listOperations: (
    address: string,
    pagination: Pagination,
  ) => Promise<[Operation<AssetInfo>[], string]>;
  preSignOperationHook?: PreSignOperationHook;
};
