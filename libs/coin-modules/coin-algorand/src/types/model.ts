import { StringMemo } from "@ledgerhq/coin-framework/api/types";

// Algorand memo type for AlpacaApi
export type AlgorandMemo = StringMemo<"note">;

// Operation mode for Algorand transactions
export type AlgorandOperationMode = "send" | "optIn" | "claimReward";

// List operations options
export type Order = "asc" | "desc";

export type ListOperationsOptions = {
  limit?: number;
  minHeight?: number;
  token?: string;
  order?: Order;
};

// Algorand resources (staking rewards, assets)
export type AlgorandResources = {
  rewards: bigint;
  nbAssets: number;
};
