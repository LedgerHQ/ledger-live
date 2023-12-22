import type { BigNumber } from "bignumber.js";
import {
  Account,
  AccountRaw,
  Operation,
  OperationRaw,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";

export type PRep = {
  grade: string | null | undefined;
  status: string | null | undefined;
  penalty: string | null | undefined;
  bonded: BigNumber | string | null | undefined;
  delegated: BigNumber | string | null | undefined;
  power: BigNumber | string | null | undefined;
  name: string | null | undefined;
  country: string | null | undefined;
  city: string | null | undefined;
  details: string | null | undefined;
  website: string | null | undefined;
  address: string;
  nodeAddress: string | null | undefined;
  irep: BigNumber | string | null | undefined;
  irepUpdateBlockHeight: string | null | undefined;
  lastHeight: BigNumber | string | null | undefined;
  totalBlocks: BigNumber | string | null | undefined;
  validatedBlocks: BigNumber | string | null | undefined;
  p2pEndpoint: string | null | undefined;
};

/**
 * Icon account resources
 */
export type IconResources = {
  nonce: number;
  votingPower: string | BigNumber;
  totalDelegated: string | BigNumber;
  unwithdrawnReward: string | BigNumber;
  unstake: string | BigNumber;
};

/**
 * Icon account resources from raw JSON
 */
export type IconResourcesRaw = {
  nonce: number;
  votingPower: string | BigNumber;
  totalDelegated: string | BigNumber;
  unwithdrawnReward: string | BigNumber;
  unstake: string | BigNumber;
};

/**
 * Icon transaction
 */
export type Transaction = TransactionCommon & {
  mode: string;
  family: "icon";
  fees?: BigNumber | null | undefined;
  stepLimit?: BigNumber;
};

/**
 * Icon transaction from a raw JSON
 */
export type TransactionRaw = TransactionCommonRaw & {
  family: "icon";
  mode: string;
  fees?: string | null | undefined;
  stepLimit?: BigNumber;
  // also the transaction fields as raw JSON data
};

export type IconAccount = Account & { iconResources: IconResources };

export type IconAccountRaw = AccountRaw & {
  iconResources: IconResourcesRaw;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type IconOperation = Operation<IconGridExtraTxInfo>;
export type IconOperationRaw = OperationRaw<IconGridExtraTxInfoRaw>;

export type IconGridExtraTxInfo = {
  frozenAmount?: BigNumber;
  unfreezeAmount?: BigNumber;
};
export type IconGridExtraTxInfoRaw = {
  frozenAmount?: string;
  unfreezeAmount?: string;
};
