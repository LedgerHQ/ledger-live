import type { BigNumber } from "bignumber.js";
import type {
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import type { Account, AccountRaw } from "@ledgerhq/types-live";

/**
 * Sui account resources
 */
export type SuiResources = {
  nonce: number;
  additionalBalance: BigNumber;
};

/**
 * Sui account resources from raw JSON
 */
export type SuiResourcesRaw = {
  nonce: number;
  additionalBalance: string;
};

/**
 * Sui transaction
 */
export type Transaction = TransactionCommon & {
  mode: string;
  family: "sui";
  fees?: BigNumber | null;
  // add here all transaction-specific fields if you implement other modes than "send"
};

/**
 * Sui transaction from a raw JSON
 */
export type TransactionRaw = TransactionCommonRaw & {
  family: "sui";
  mode: string;
  fees?: string;
  // also the transaction fields as raw JSON data
};

/**
 * Sui currency data that will be preloaded.
 * You can for instance add a list of validators for Proof-of-Stake blockchains,
 * or any volatile data that could not be set as constants in the code (staking progress, fee estimation variables, etc.)
 */
export type SuiPreloadData = {
  somePreloadedData: Record<any, any>;
};

export type SuiAccount = Account & {
  // ...
  // // On some blockchain, an account can have resources (gained, delegated, ...)
  suiResources?: SuiResources;
};

export type SuiAccountRaw = AccountRaw & {
  suiResources?: SuiResourcesRaw;
};

export type TransactionStatus = TransactionStatusCommon;
export type TransactionStatusRaw = TransactionStatusCommonRaw;
