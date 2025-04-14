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
import type { Validators } from "../network/validators";

export * from "./signer";
export * from "./bridge";
export type { Validators, ValidatorsRaw } from "../network/validators";

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

export type StakeOperationType = "add" | "unlock" | "reactivate" | "withdraw";

export type StakeTransaction = {
  op: StakeOperationType;
  poolAddr: string;
};

export type Transaction = TransactionCommon & {
  family: "aptos";
  mode: string;
  fees?: BigNumber | null;
  options: TransactionOptions;
  errors?: TransactionErrors;
  stake?: StakeTransaction;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "aptos";
  mode: string;
  fees?: string | null;
  options: string;
  errors?: string;
  stake?: string;
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
  delegation:
    | {
        stake: number;
        voteAccAddr: string;
      }
    | undefined;
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

export type AptosStakeWithMeta = {
  stake: AptosStake;
  meta: {
    validator?: {
      name?: string;
      img?: string;
      url?: string;
    };
  };
};

export type AptosResources = {
  stakes: AptosStake[];
  unstakeReserve: BigNumber;
};

export type AptosResourcesRaw = {
  stakes: string;
  unstakeReserve: string;
};

export type AptosValidator = {
  voteAccAddr: string;
  commission: number;
  activatedStake: number;
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
  validators: Validators[];
};
