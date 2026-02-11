import type {
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
  Operation,
  OperationRaw,
} from "@ledgerhq/types-live";
import type { Account, AccountRaw } from "@ledgerhq/types-live";
import { DelegatedStake, StakeObject, SuiValidatorSummary } from "@mysten/sui/client";
import type { BigNumber } from "bignumber.js";

export type MappedStake = StakeObject & {
  rank: number;
  validator: SuiValidator;
  stakedSuiId: string;
  formattedAmount: string;
  formattedEstimatedReward: string;
};

/**
 * Sui account resources
 */
export type SuiResources = {
  stakes?: DelegatedStake[];
  cachedOps?: Record<string, Record<string, string>>;
};

/**
 * Sui account resources from raw JSON
 */
export type SuiResourcesRaw = object;

export type SuiTransactionMode = "send" | "token.send" | "delegate" | "undelegate";

/**
 * Sui transaction
 */
export type Transaction = TransactionCommon & {
  mode: SuiTransactionMode;
  family: "sui";
  amount: BigNumber | null;
  fees?: BigNumber | null;
  errors?: Record<string, Error>;
  skipVerify?: boolean;
  coinType: string;
  stakedSuiId?: string;
  tokenId?: string;
  // add here all transaction-specific fields when implement other modes than "send"
};

export type CreateExtrinsicArg = {
  amount: BigNumber;
  coinType: string;
  mode: SuiTransactionMode;
  recipient: string;
  useAllAmount?: boolean;
  stakedSuiId?: string;
};

/**
 * Sui transaction from a raw JSON
 */
export type TransactionRaw = TransactionCommonRaw & {
  family: "sui";
  mode: SuiTransactionMode;
  coinType: string;
  fees?: string;
  // also the transaction fields as raw JSON data
};

/**
 * Sui validator metadata
 */
export type SuiValidator = SuiValidatorSummary & { apy: number };

/**
 * Sui token data from CAL
 */
export type SuiToken = [
  string, // parent currency id
  string, // name
  string, // ticker
  string, // contract address
  number, // precision
  string, // ledgerSignature
];

/**
 * Sui currency data that will be preloaded.
 * You can for instance add a list of validators for Proof-of-Stake blockchains,
 * or any volatile data that could not be set as constants in the code (staking progress, fee estimation variables, etc.)
 */
export type SuiPreloadData = { validators: SuiValidator[]; tokens: SuiToken[] };

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
  coinType?: string;
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
  kind: SuiTransactionMode;
  sender: string;
  recipient: string;
  amount: number;
};

export type TokenTransferCommand = {
  kind: string;
  sender: string;
  recipient: string;
  amount: number;
};

export type Command = TransferCommand | TokenTransferCommand;

export type CommandDescriptor = {
  command: Command;
  fee: number;
  warnings: Record<string, Error>;
  errors: Record<string, Error>;
};
