import type {
  Account,
  AccountRaw,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";

export type NetworkInfo = {
  family: "hedera";
};

export type NetworkInfoRaw = {
  family: "hedera";
};

export type HederaOperationMode = "send" | "stake";

export type Transaction = TransactionCommon & {
  family: "hedera";
  memo?: string;
  mode?: HederaOperationMode | null;
  staked?: HederaStake;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "hedera";
  memo?: string;
  mode?: HederaOperationMode | null;
  staked?: HederaStake;
};

export type HederaStake = {
  stakeType?: string | null;
  stakeMethod?: string | null;

  accountId?: string | null;
  nodeId?: number | null;
  declineRewards?: boolean | null;
};

export type StakeType = "new" | "change" | "stop";
export const STAKE_TYPE = {
  NEW: "new",
  CHANGE: "change",
  STOP: "stop",
};

export type StakeMethod = "node" | "account";
export const STAKE_METHOD = {
  NODE: "node",
  ACCOUNT: "account",
};

// `HederaResources | HederaResourcesRaw` is in the `HederaAccount` (i.e., `Account`) type
// `HederaStake` info will be retrieved via mirrornode REST API fetch
export type HederaResources = {
  staked: HederaStake;
};

export type HederaResourcesRaw = {
  staked: HederaStake;
};

export type HederaAccount = Account & { hederaResources: HederaResources };

export type HederaAccountRaw = AccountRaw & {
  hederaResources: HederaResourcesRaw;
};

export type CoreStatics = Record<string, never>;
export type CoreAccountSpecifics = Record<string, never>;
export type CoreOperationSpecifics = Record<string, never>;
export type CoreCurrencySpecifics = Record<string, never>;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const reflect = (_declare: any) => {};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;
