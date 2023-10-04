import type { BigNumber } from "bignumber.js";
import {
  Account,
  AccountRaw,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";

export type PublicRepresentativeData = {
  delegations: PRep[];
  totalDelegated: BigNumber;
};

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

export type Vote = {
  address: string | null | undefined;
  value: BigNumber | string | null | undefined;
};
/**
 * Icon account resources
 */
export type IconResources = {
  nonce: number;
  additionalBalance: BigNumber;
  votes: Vote[];
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
  additionalBalance: string;
  votes: Vote[];
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
  value?: BigNumber | null | undefined;
  fee?: BigNumber | null | undefined;
  state?: number | null | undefined;
  txHash?: string | null | undefined;
  fromAddr?: string | null | undefined;
  toAddr?: string | null | undefined;
  nonce?: number | undefined;
  height?: number | null | undefined;
  createDate?: number | null | undefined;
  errorMsg?: string | null | undefined;
  dataType?: string | null | undefined;
  targetContractAddr?: string | null | undefined;
  txType?: string | null | undefined;
  id?: string | null | undefined;
  votes: Vote[];
  stepLimit?: BigNumber;
  // add here all transaction-specific fields if you implement other modes than "send"
};

/**
 * Icon transaction from a raw JSON
 */
export type TransactionRaw = TransactionCommonRaw & {
  family: "icon";
  mode: string;
  fees?: string | null | undefined;
  votes: Vote[];
  // also the transaction fields as raw JSON data
};

/**
 * Icon currency data that will be preloaded.
 * You can for instance add a list of validators for Proof-of-Stake blockchains,
 * or any volatile data that could not be set as constants in the code (staking progress, fee estimation variables, etc.)
 */
export type IconPreloadData = {
  somePreloadedData: Record<any, any>;
};

export type IconAccount = Account & { iconResources: IconResources };

export type IconAccountRaw = AccountRaw & {
  iconResources: IconResourcesRaw;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;
