import type {
  Account,
  AccountRaw,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

export type ElrondResources = {
  nonce: number;
  delegations: ElrondDelegation[];
  providers: any;
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
 * Elrond account resources from raw JSON
 */
export type ElrondResourcesRaw = {
  nonce: number;
  delegations: ElrondDelegation[];
  providers: any;
};

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
 * Elrond mode of transaction
 */
export type ElrondTransactionMode =
  | "send"
  | "delegate"
  | "reDelegateRewards"
  | "unDelegate"
  | "claimRewards"
  | "withdraw";

/**
 * Elrond transaction
 */
export type Transaction = TransactionCommon & {
  mode: ElrondTransactionMode;
  transfer?: ElrondTransferOptions;
  family: "elrond";
  fees: BigNumber | null | undefined;
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
  action?: any;
};

export enum ElrondTransferOptions {
  egld = "egld",
  esdt = "esdt",
}

export type ESDTToken = {
  identifier: string;
  name: string;
  balance: string;
};

/**
 * Elrond transaction from a raw JSON
 */
export type TransactionRaw = TransactionCommonRaw & {
  family: "elrond";
  mode: ElrondTransactionMode;
  fees: string | null | undefined;
  gasLimit: number;
};
export type ElrondValidator = {
  bls: string;
  identity: string;
  owner: string;
  provider: string;
  type: string;
  status: string;
  nonce: number;
  stake: BigNumber;
  topUp: BigNumber;
  locked: BigNumber;
  online: boolean;
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
  validators: Record<string, any>;
};

export type ElrondAccount = Account & { elrondResources: ElrondResources };

export type ElrondAccountRaw = AccountRaw & {
  elrondResources: ElrondResourcesRaw;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;
