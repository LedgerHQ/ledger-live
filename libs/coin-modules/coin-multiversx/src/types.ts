import type {
  Account,
  AccountRaw,
  Operation,
  OperationExtra,
  OperationExtraRaw,
  OperationRaw,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

export type MultiversXAccount = Account & { multiversxResources: MultiversXResources };

export type MultiversXAccountRaw = AccountRaw & {
  multiversxResources: MultiversXResourcesRaw;
};

export type MultiversXResources = {
  nonce: number;
  delegations: MultiversXDelegation[];
  isGuarded: boolean;
};

export type MultiversXResourcesRaw = {
  nonce: number;
  delegations: MultiversXDelegation[];
  isGuarded: boolean;
};

export type MultiversXDelegation = {
  address: string;
  contract: string;
  userUnBondable: string;
  userActiveStake: string;
  claimableRewards: string;
  userUndelegatedList: UserUndelegated[];
};

export type UserUndelegated = {
  amount: string;
  seconds: number;
};

/**
 * MultiversX transaction
 */
export type Transaction = TransactionCommon & {
  family: "multiversx";
  mode: MultiversXTransactionMode;
  fees: BigNumber | null | undefined;
  data?: string;
  gasLimit: number;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "multiversx";
  mode: MultiversXTransactionMode;
  fees: string | null | undefined;
  data?: string;
  gasLimit: number;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type MultiversXTransactionMode =
  | "send"
  | "delegate"
  | "reDelegateRewards"
  | "unDelegate"
  | "claimRewards"
  | "withdraw";

/**
 * MultiversX transaction payload to sign
 */
export type MultiversXProtocolTransaction = {
  nonce: number;
  value: string;
  receiver: string;
  sender: string;
  gasPrice: number;
  gasLimit: number;
  chainID: string;
  signature?: string;
  data?: string; //for ESDT or stake transactions
  version: number;
  options: number;
};

/**
 * MultiversX transaction as received from explorer
 */
export type MultiversXApiTransaction = {
  mode: MultiversXTransactionMode;
  fees: BigNumber | null | undefined;
  transfer?: MultiversXTransferOptions;
  txHash?: string;
  sender?: string;
  receiver?: string;
  value?: BigNumber;
  blockHash?: string;
  blockHeight?: number;
  timestamp?: number;
  nonce?: number;
  gasLimit: number;
  status?: string;
  fee?: BigNumber;
  round?: number;
  miniBlockHash?: string;
  data?: string;
  tokenIdentifier?: string;
  tokenValue?: string;
  action?: MultiversXTransactionAction;
  operations?: MultiversXTransactionOperation[];
};

export enum MultiversXTransferOptions {
  egld = "egld",
  esdt = "esdt",
}

export type MultiversXTransactionOperation = {
  action: string;
  type: string;
  sender: string;
  receiver: string;
  value: string;
};

export type MultiversXTransactionAction = {
  category: string;
  name: string;
  arguments: MultiversXTransactionActionArguments;
};

export type MultiversXTransactionActionArguments = {
  transfers: MultiversXTransactionActionArgumentsTransfers[];
};

export type MultiversXTransactionActionArgumentsTransfers = {
  token: string;
  value: string;
};

export type ESDTToken = {
  identifier: string;
  name: string;
  balance: string;
};

export type NetworkInfo = {
  family?: "multiversx";
  chainID: string;
  denomination: number;
  gasLimit: number;
  gasPrice: number;
  gasPerByte: number;
  gasPriceModifier: string;
};

export type NetworkInfoRaw = {
  family?: "multiversx";
  chainID: string;
  denomination: number;
  gasLimit: number;
  gasPrice: number;
  gasPerByte: number;
};

export type MultiversXPreloadData = {
  validators: MultiversXProvider[];
};

/**
 * MultiversX validator
 */
export type MultiversXProvider = {
  contract: string;
  owner: string;
  serviceFee: string;
  maxDelegationCap: string;
  initialOwnerFunds: string;
  totalActiveStake: string;
  totalUnstaked: string;
  maxDelegateAmountAllowed: string;
  apr: string;
  explorerURL: string;
  address: string;
  aprValue: number;
  automaticActivation: boolean;
  changeableServiceFee: boolean;
  checkCapOnRedelegate: boolean;
  createdNonce: number;
  featured: boolean;
  numNodes: number;
  numUsers: number;
  ownerBelowRequiredBalanceThreshold: boolean;
  unBondPeriod: number;
  withDelegationCap: boolean;
  disabled?: boolean;
  identity: {
    key: string;
    name: string;
    avatar: string;
    description: string;
    location?: string;
    twitter: string;
    url: string;
  };
};

export type MultiversXOperation = Operation<MultiversXOperationExtra>;
export type MultiversXOperationRaw = OperationRaw<MultiversXOperationExtraRaw>;

export type MultiversXOperationExtra = {
  amount?: BigNumber;
};

export function isMultiversXOperationExtra(op: OperationExtra): op is MultiversXOperationExtra {
  return op !== null && typeof op === "object" && "amount" in op;
}

export type MultiversXOperationExtraRaw = {
  amount?: string;
};
export function isMultiversXOperationExtraRaw(
  op: OperationExtraRaw,
): op is MultiversXOperationExtraRaw {
  return op !== null && typeof op === "object" && "amount" in op;
}
