import {
  Account,
  AccountRaw,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import type { BigNumber } from "bignumber.js";
import { Validator } from "@helium/http";

// for legacy reasons export the types
export type CoreStatics = Record<string, never>;
export type CoreAccountSpecifics = Record<string, never>;
export type CoreOperationSpecifics = Record<string, never>;
export type CoreCurrencySpecifics = Record<string, never>;

export type NetworkInfo = {
  family: "helium";
};

export type NetworkInfoRaw = {
  family: "helium";
};

export type TransactionModel = SendTransaction | BurnTransaction;

export type SendTransaction = {
  mode: "send";
  memo: string | undefined;
};

export type BurnTransaction = {
  mode: "burn";
  payee: string;
  memo: string;
  hipID?: string;
};

export type Transaction = TransactionCommon & {
  family: "helium";
  fees?: BigNumber;
  model: TransactionModel;
  networkInfo?: NetworkInfo;
};
export type TransactionRaw = TransactionCommonRaw & {
  family: "helium";
  fees?: string;
  model: string;
  networkInfo?: NetworkInfoRaw;
};

export type HeliumResources = {
  stakes: Validator[];
};

export type HeliumResourcesRaw = {
  stakes: string;
};

export type HeliumPreloadData = {
  votes: HeliumVote[];
};

export type HeliumVote = {
  id: string;
  name: string;
  description: string;
  tags: {
    primary: string;
    secondary: string;
  };
  blocksRemaining?: number;
  deadline: number;
  outcomes: HeliumVoteOutcome[];
  timestamp?: number;
};

export type HeliumVoteOutcome = {
  value: string;
  address: string;
  hntVoted?: number;
  uniqueWallets?: number;
};

export type HeliumVoteResults = {
  outcomes: HeliumVoteOutcome[];
  timestamp: number;
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const reflect = (_declare: any): void => {};

export type HeliumAccount = Account & { heliumResources: HeliumResources };

export type HeliumAccountRaw = AccountRaw & {
  heliumResources: HeliumResourcesRaw;
};

export type TransactionStatus = TransactionStatusCommon;
export type TransactionStatusRaw = TransactionStatusCommonRaw;
