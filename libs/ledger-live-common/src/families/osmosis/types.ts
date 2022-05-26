import type { BigNumber } from "bignumber.js";
import {
  CosmosLikeTransaction,
  CosmosLikeTransactionRaw,
} from "../cosmos/types";

export type Transaction = CosmosLikeTransaction & {
  family: "osmosis";
};

export type TransactionRaw = CosmosLikeTransactionRaw & {
  family: "osmosis";
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
