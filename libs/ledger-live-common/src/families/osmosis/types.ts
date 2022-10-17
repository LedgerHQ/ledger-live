import type { BigNumber } from "bignumber.js";
import {
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
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

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type OsmosisRewardsState = {
  targetBondedRatio: number;
  communityPoolCommission: number;
  assumedTimePerBlock: number;
  inflationRateChange: number;
  inflationMaxRate: number;
  inflationMinRate: number;
  actualBondedRatio: number;
  averageTimePerBlock: number;
  totalSupply: number;
  averageDailyFees: number;
  currentValueInflation: number;
};
