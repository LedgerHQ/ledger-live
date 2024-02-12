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

export type ElrondAccount = Account & { elrondResources: ElrondResources };

export type ElrondAccountRaw = AccountRaw & {
  elrondResources: ElrondResourcesRaw;
};

export type ElrondResources = {
  nonce: number;
  delegations: ElrondDelegation[];
  isGuarded: boolean;
};

export type ElrondResourcesRaw = {
  nonce: number;
  delegations: ElrondDelegation[];
  isGuarded: boolean;
};

export type ElrondDelegation = {
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
 * Elrond transaction
 */
export type Transaction = TransactionCommon & {
  family: "elrond";
  mode: ElrondTransactionMode;
  fees: BigNumber | null | undefined;
  data?: string;
  gasLimit: number;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "elrond";
  mode: ElrondTransactionMode;
  fees: string | null | undefined;
  data?: string;
  gasLimit: number;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type ElrondTransactionMode =
  | "send"
  | "delegate"
  | "reDelegateRewards"
  | "unDelegate"
  | "claimRewards"
  | "withdraw";

/**
 * Elrond transaction payload to sign
 */
export type ElrondProtocolTransaction = {
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
 * Elrond transaction as received from explorer
 */
export type ElrondApiTransaction = {
  mode: ElrondTransactionMode;
  fees: BigNumber | null | undefined;
  transfer?: ElrondTransferOptions;
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
  action?: ElrondTransactionAction;
  operations?: ElrondTransactionOperation[];
};

export enum ElrondTransferOptions {
  egld = "egld",
  esdt = "esdt",
}

export type ElrondTransactionOperation = {
  action: string;
  type: string;
  sender: string;
  receiver: string;
  value: string;
};

export type ElrondTransactionAction = {
  category: string;
  name: string;
  arguments: ElrondTransactionActionArguments;
};

export type ElrondTransactionActionArguments = {
  transfers: ElrondTransactionActionArgumentsTransfers[];
};

export type ElrondTransactionActionArgumentsTransfers = {
  token: string;
  value: string;
};

export type ESDTToken = {
  identifier: string;
  name: string;
  balance: string;
};

export type NetworkInfo = {
  family?: "elrond";
  chainID: string;
  denomination: number;
  gasLimit: number;
  gasPrice: number;
  gasPerByte: number;
  gasPriceModifier: string;
};

export type NetworkInfoRaw = {
  family?: "elrond";
  chainID: string;
  denomination: number;
  gasLimit: number;
  gasPrice: number;
  gasPerByte: number;
};

export type ElrondPreloadData = {
  validators: ElrondProvider[];
};

/**
 * Elrond validator
 */
export type ElrondProvider = {
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

export type ElrondOperation = Operation<ElrondOperationExtra>;
export type ElrondOperationRaw = OperationRaw<ElrondOperationExtraRaw>;

export type ElrondOperationExtra = {
  amount?: BigNumber;
};
export function isElrondOperationExtra(op: OperationExtra): op is ElrondOperationExtra {
  return op !== null && typeof op === "object" && "amount" in op;
}

export type ElrondOperationExtraRaw = {
  amount?: string;
};
export function isElrondOperationExtraRaw(op: OperationExtraRaw): op is ElrondOperationExtraRaw {
  return op !== null && typeof op === "object" && "amount" in op;
}
