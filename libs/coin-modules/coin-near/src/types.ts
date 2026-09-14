import {
  Account,
  AccountRaw,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import type { BigNumber } from "bignumber.js";
import type { NearStakingPosition } from "./network/sdk.types";

export type { NearStakingPosition } from "./network/sdk.types";

export type Transaction = TransactionCommon & {
  family: "near";
  mode: string;
  /** `null` until estimated, matching the generic-coin-framework's `createTransaction`. */
  fees?: BigNumber | null;
  /**
   * Set by the generic-coin-framework's `createTransaction`. A NEAR nonce belongs to an access key
   * rather than to the account, so the value is inert for crafting — it exists so `signOperation`
   * can skip `getNextSequence`, which this module deliberately does not implement. It has to
   * survive serialization, or a restored transaction sends `signOperation` down that throwing path.
   */
  nonce?: BigNumber;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "near";
  mode: string;
  fees?: string | null;
  nonce?: string;
};

export type NearPreloadedData = {
  storageCost: BigNumber;
  gasPrice: BigNumber;
  createAccountCostSend: BigNumber;
  createAccountCostExecution: BigNumber;
  transferCostSend: BigNumber;
  transferCostExecution: BigNumber;
  addKeyCostSend: BigNumber;
  addKeyCostExecution: BigNumber;
  receiptCreationSend: BigNumber;
  receiptCreationExecution: BigNumber;
  minGasPurchasePrice: BigNumber;
  accountCreationCharge: BigNumber;
  validators: NearValidatorItem[];
};

export type NearResources = {
  stakedBalance: BigNumber;
  availableBalance: BigNumber;
  pendingBalance: BigNumber;
  storageUsageBalance: BigNumber;
  stakingPositions: NearStakingPosition[];
};

export type NearResourcesRaw = {
  stakedBalance: string;
  availableBalance: string;
  pendingBalance: string;
  storageUsageBalance: string;
  stakingPositions: {
    staked: string;
    available: string;
    pending: string;
    validatorId: string;
  }[];
};

export type NearAccount = Account & { nearResources: NearResources };

export type NearAccountRaw = AccountRaw & {
  nearResources: NearResourcesRaw;
};

export type NearValidatorItem = {
  validatorAddress: string;
  commission: number | null;
  tokens: string;
};

export type NearMappedStakingPosition = NearStakingPosition & {
  formattedAmount: string;
  formattedPending: string;
  formattedAvailable: string;
  rank: number;
  validator: NearValidatorItem | null | undefined;
};

export type StatusErrorMap = {
  recipient?: Error;
  amount?: Error;
  fees?: Error;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;
