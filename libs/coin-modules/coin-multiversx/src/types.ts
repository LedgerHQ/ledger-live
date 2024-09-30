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

export type MultiversxAccount = Account & { multiversxResources: MultiversxResources };

export type MultiversxAccountRaw = AccountRaw & {
  multiversxResources: MultiversxResourcesRaw;
};

export type MultiversxResources = {
  nonce: number;
  delegations: MultiversxDelegation[];
  isGuarded: boolean;
};

export type MultiversxResourcesRaw = {
  nonce: number;
  delegations: MultiversxDelegation[];
  isGuarded: boolean;
};

export type MultiversxDelegation = {
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
 * Multiversx transaction
 */
export type Transaction = TransactionCommon & {
  family: "multiversx";
  mode: MultiversxTransactionMode;
  fees: BigNumber | null | undefined;
  data?: string;
  gasLimit: number;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "multiversx";
  mode: MultiversxTransactionMode;
  fees: string | null | undefined;
  data?: string;
  gasLimit: number;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type MultiversxTransactionMode =
  | "send"
  | "delegate"
  | "reDelegateRewards"
  | "unDelegate"
  | "claimRewards"
  | "withdraw";

/**
 * Multiversx transaction payload to sign
 */
export type MultiversxProtocolTransaction = {
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
 * Multiversx transaction as received from explorer
 */
export type MultiversxApiTransaction = {
  mode: MultiversxTransactionMode;
  fees: BigNumber | null | undefined;
  transfer?: MultiversxTransferOptions;
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
  action?: MultiversxTransactionAction;
  operations?: MultiversxTransactionOperation[];
};

export enum MultiversxTransferOptions {
  egld = "egld",
  esdt = "esdt",
}

export type MultiversxTransactionOperation = {
  action: string;
  type: string;
  sender: string;
  receiver: string;
  value: string;
};

export type MultiversxTransactionAction = {
  category: string;
  name: string;
  arguments: MultiversxTransactionActionArguments;
};

export type MultiversxTransactionActionArguments = {
  transfers: MultiversxTransactionActionArgumentsTransfers[];
};

export type MultiversxTransactionActionArgumentsTransfers = {
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

export type MultiversxPreloadData = {
  validators: MultiversxProvider[];
};

/**
 * Multiversx validator
 */
export type MultiversxProvider = {
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

export type MultiversxOperation = Operation<MultiversxOperationExtra>;
export type MultiversxOperationRaw = OperationRaw<MultiversxOperationExtraRaw>;

export type MultiversxOperationExtra = {
  amount?: BigNumber;
};

export function isMultiversxOperationExtra(op: OperationExtra): op is MultiversxOperationExtra {
  return op !== null && typeof op === "object" && "amount" in op;
}

export type MultiversxOperationExtraRaw = {
  amount?: string;
};
export function isMultiversxOperationExtraRaw(
  op: OperationExtraRaw,
): op is MultiversxOperationExtraRaw {
  return op !== null && typeof op === "object" && "amount" in op;
}
