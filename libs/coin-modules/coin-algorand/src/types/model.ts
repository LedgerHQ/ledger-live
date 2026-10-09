import { StringMemo } from "@ledgerhq/coin-module-framework/api/types";

// Algorand memo type for CoinModuleApi
export type AlgorandMemo = StringMemo<"note">;

// Operation mode for Algorand transactions
export type AlgorandOperationMode = "send" | "optIn";

// List operations options
export type Order = "asc" | "desc";

export type ListOperationsOptions = {
  limit?: number;
  minHeight?: number;
  cursor?: string | undefined;
  order?: Order;
};
