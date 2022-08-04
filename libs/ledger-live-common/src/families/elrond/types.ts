import {
  Account,
  AccountRaw,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import type { BigNumber } from "bignumber.js";
import { Range, RangeRaw } from "../../range";

export type ElrondResources = {
  nonce: number;
};

/**
 * Elrond account resources from raw JSON
 */
export type ElrondResourcesRaw = {
  nonce: number;
};

/**
 * Elrond transaction
 */
export type Transaction = TransactionCommon & {
  mode: string;
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
  status?: string;
  fee?: BigNumber;
  round?: number;
  miniBlockHash?: string;
};

/**
 * Elrond transaction from a raw JSON
 */
export type TransactionRaw = TransactionCommonRaw & {
  family: "elrond";
  mode: string;
  fees: string | null | undefined;
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
  family: "elrond";
  gasPrice: Range;
};
export type NetworkInfoRaw = {
  family: "elrond";
  gasPrice: RangeRaw;
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
