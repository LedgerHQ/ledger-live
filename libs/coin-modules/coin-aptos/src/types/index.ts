import type { UserTransactionResponse } from "@aptos-labs/ts-sdk";
import type {
  Account,
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

export interface TransactionOptions {
  maxGasAmount: string;
  gasUnitPrice: string;
}

export type TransactionErrors = {
  maxGasAmount?: string;
  gasUnitPrice?: string;
};

export type Transaction = TransactionCommon & {
  mode: string;
  family: "aptos";
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

export type AptosStake = {
  stakeAccAddr: string;
  hasStakeAuth: boolean;
  hasWithdrawAuth: boolean;
  // delegation:
  //   | {
  //       stake: number;
  //       voteAccAddr: string;
  //     }
  //   | undefined;
  stakeAccBalance: number;
  // rentExemptReserve: number;
  withdrawable: number;
  activation: {
    state: "active" | "inactive" | "activating" | "deactivating";
    active: number;
    inactive: number;
  };
  reward?:
    | {
        amount: number;
      }
    | undefined;
};

export type AptosResources = {
  stakes: AptosStake[];
  unstakeReserve: BigNumber;
};

export type AptosResourcesRaw = {
  stakes: string;
  unstakeReserve: string;
};
