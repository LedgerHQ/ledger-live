import type { CryptoOrTokenCurrency } from "@domain/entity-currency";

export type AssetTrendRange = "all" | "year" | "month" | "week" | "day";

export type AssetTableItem = {
  readonly currency: CryptoOrTokenCurrency;
  readonly balance: number;
  readonly value: number;
  readonly distribution: number;
  readonly accounts: readonly unknown[];
  readonly isPlaceholder: boolean;
  readonly marketPrice?: number;
  readonly marketId?: string;
  readonly trend?: number | null;
};
