import type { BigNumber } from "bignumber.js";
import {
  CosmosLikeTransaction,
  CosmosLikeTransactionRaw,
} from "../cosmos/types";
import type { Operation, OperationRaw } from "../../types/operation";
import { CosmosDelegationInfo, CosmosDelegationInfoRaw } from "../cosmos/types";

export type OsmosisOperation = Operation & {
  extra: OsmosisExtraTxInfo;
};
export type OsmosisOperationRaw = OperationRaw & {
  extra: OsmosisExtraTxInfo;
};
export type OsmosisExtraTxInfo = {
  validators?: CosmosDelegationInfo[];
  osmosisSourceValidator?: string | null | undefined;
  validator?: CosmosDelegationInfo;
};

export type Transaction = CosmosLikeTransaction & {
  family: "osmosis";
  mode: string;
  fees: BigNumber | null;
  gas: BigNumber | null | undefined;
  memo: string | null | undefined;
  validators: CosmosDelegationInfo[];
};

export type TransactionRaw = CosmosLikeTransactionRaw & {
  family: "osmosis";
  mode: string;
  fees: string | null;
  gas: string | null | undefined;
  memo: string | null | undefined;
  validators: CosmosDelegationInfoRaw[];
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
