import type { BigNumber } from "bignumber.js";
import type {
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
  Operation,
  OperationRaw,
} from "@ledgerhq/types-live";
import type { Account, AccountRaw } from "@ledgerhq/types-live";

/**
 * Sui account resources
 */
export type SuiResources = object;

/**
 * Sui account resources from raw JSON
 */
export type SuiResourcesRaw = object;

/**
 * Sui transaction
 */
export type Transaction = TransactionCommon & {
  mode: string;
  family: "sui";
  amount: BigNumber | null;
  fees?: BigNumber | null;
  errors: Record<string, Error>;
  skipVerify?: boolean;
  // add here all transaction-specific fields when implement other modes than "send"
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
export type SuiPreloadData = object;

export type SuiAccount = Account & {
  // On some blockchain, an account can have resources (gained, delegated, ...)
  suiResources?: SuiResources;
};

export type SuiAccountRaw = AccountRaw & {
  suiResources?: SuiResourcesRaw;
};

export type TransactionStatus = TransactionStatusCommon;
export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type SuiOperation = Operation<SuiOperationExtra>;
export type SuiOperationRaw = OperationRaw<SuiOperationExtraRaw>;

export type SuiOperationExtra = {
  transferAmount?: BigNumber;
};
export type SuiOperationExtraRaw = Record<string, string>;

export type SuiSignedOperation = {
  operation: SuiOperation;
  signature: string;
  rawData: {
    unsigned: string;
    serializedSignature: string;
  };
};

export type TransferCommand = {
  kind: "transfer";
  sender: string;
  recipient: string;
  amount: number;
};

export type Command = TransferCommand;

export type CommandDescriptor = {
  command: Command;
  fee: number;
  warnings: Record<string, Error>;
  errors: Record<string, Error>;
};
