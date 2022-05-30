import type { BigNumber } from "bignumber.js";
import {
  CosmosLikeTransaction,
  CosmosLikeTransactionRaw,
} from "../cosmos/types";
import { CosmosDelegationInfo, CosmosDelegationInfoRaw } from "../cosmos/types";

export type Transaction = CosmosLikeTransaction & {
  family: "osmosis";
  mode: string;
  fees: BigNumber | null;
  gas: BigNumber | null | undefined;
  memo: string | null | undefined;
  validators: CosmosDelegationInfo[];
  sourceValidator: string | null | undefined;
};

export type TransactionRaw = CosmosLikeTransactionRaw & {
  family: "osmosis";
  mode: string;
  fees: string | null;
  gas: string | null | undefined;
  memo: string | null | undefined;
  validators: CosmosDelegationInfoRaw[];
  sourceValidator: string | null | undefined;
};

export type StatusErrorMap = {
  recipient?: Error;
  amount?: Error;
  fees?: Error;
  validators?: Error;
  delegate?: Error;
  redelegation?: Error;
  unbonding?: Error;
  claimReward?: Error;
  feeTooHigh?: Error;
};

export type TransactionStatus = {
  errors: StatusErrorMap;
  warnings: StatusErrorMap;
  estimatedFees: BigNumber;
  amount: BigNumber;
  totalSpent: BigNumber;
};
