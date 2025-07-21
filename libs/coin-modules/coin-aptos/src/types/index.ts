import type { UserTransactionResponse } from "@aptos-labs/ts-sdk";
import type {
  Account,
  AccountRaw,
  Operation,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import type { BigNumber } from "bignumber.js";

export * from "./signer";
export * from "./bridge";

export type AptosTransaction = UserTransactionResponse & {
  block: {
    height: number;
    hash: string;
  };
};

export type AptosOperation = Operation<AptosOperationExtra>;

export type AptosOperationRaw = Operation<AptosOperationExtraRaw>;

export type AptosAccount = Account & { aptosResources: AptosResources };

export type AptosAccountRaw = AccountRaw & {
  aptosResources: AptosResourcesRaw;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type AptosCoinStoreResource = {
  coin: {
    value: string;
  };
};

export type AptosResource<T extends Record<string, any> = any> = {
  data: T;
  type: string;
};

export type AptosAddress = {
  address: string;
  publicKey: string;
  path: string;
};

export type TransactionErrors = {
  maxGasAmount?: string;
  gasUnitPrice?: string;
};

export type Transaction = TransactionCommon & {
  family: "aptos";
  mode: string;
  fees?: BigNumber | null;
  options: TransactionOptions;
  errors?: TransactionErrors;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "aptos";
  mode: string;
  fees?: string | null;
  options: string;
  errors?: string;
};

export type AptosFungibleStoreResourceData = {
  balance: BigNumber;
  frozen: boolean;
  metadata: { inner: string };
};

export type AptosFungibleoObjectCoreResourceData = {
  owner: string;
};

export type AptosMoveResourceData = {
  guid: { id: { addr: string; creation_num: string } };
};

export type AptosMoveResource = {
  [key: string]: AptosMoveResourceData;
};

export type AptosOperationExtra = {
  stake?: ExtraStakeInfo;
};

export type ExtraStakeInfo = {
  address: string;
  amount: BigNumber;
};

export type AptosOperationExtraRaw = {
  stake?: ExtraStakeInfoRaw;
};

export type ExtraStakeInfoRaw = {
  address: string;
  amount: string;
};

export type AptosResources = {
  activeBalance: BigNumber;
  inactiveBalance: BigNumber;
  pendingInactiveBalance: BigNumber;
  stakingPositions: AptosStakingPosition[];
};

export type AptosResourcesRaw = {
  activeBalance: string;
  pendingInactiveBalance: string;
  inactiveBalance: string;
  stakingPositions: {
    active: string;
    pendingInactive: string;
    inactive: string;
    validatorId: string;
  }[];
};

export type AptosStakingPosition = {
  active: BigNumber;
  inactive: BigNumber;
  pendingInactive: BigNumber;
  validatorId: string;
};

export type AptosMappedStakingPosition = AptosStakingPosition & {
  formattedAmount: string;
  formattedPending: string;
  formattedAvailable: string;
  rank: number;
  validator: AptosValidator | null | undefined;
};

export type AptosValidator = {
  activeStake: BigNumber;
  commission: BigNumber;
  address: string;
  name?: string | undefined;
  shares: string;
  avatarUrl?: string | undefined;
  wwwUrl?: string | undefined;
  nextUnlockTime?: string | undefined;
};

export type AptosValidatorRaw = {
  active_stake?: number | null;
  commission?: number | null;
  addr?: string | null;
  name?: string | null;
  shares: string;
  avatar_url?: string | null;
  www_url?: string | null;
  nextUnlockTime?: string | undefined;
};

export type AptosValidatorWithMeta = {
  validator: AptosValidator;
  meta: {
    name?: string;
    img?: string;
  };
};

export type AptosPreloadData = {
  validatorsWithMeta: AptosValidatorWithMeta[];
  validators: AptosValidator[];
};

export interface TransactionOptions {
  maxGasAmount: string;
  gasUnitPrice: string;
}

export interface StakePoolResource {
  locked_until_secs: string;
}
export type AptosBalance = {
  contractAddress: string;
  amount: BigNumber;
};
