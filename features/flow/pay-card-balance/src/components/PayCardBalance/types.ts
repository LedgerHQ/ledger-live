import type { PayCardBalanceFilter } from "@domain/entity-pay-card";
import type { FormattedValue } from "@ledgerhq/lumen-utils-shared";

// Shared by both platforms (`AmountDisplay`);
export type { FormattedValue };

export type PayCardBalanceStatus = "loading" | "error" | "ready";

export type PayCardBalanceLabels = Readonly<{
  emptyTitle: string;
  emptyDescription: string;
}>;

// Host input for the hero, produced by {@link aggregatePayCardBalance} in both apps.
export type PayCardBalanceData = Readonly<{
  status: PayCardBalanceStatus;
  /** Aggregated stablecoin countervalue, in the user's counter currency. */
  stableBalance: number;
  /** Active balance filter (`"all"` or a single stablecoin currencyId). */
  filter: PayCardBalanceFilter;
  formatCountervalue: (value: number) => FormattedValue;
}>;

export type PayCardStablecoin = Readonly<{
  currency: Readonly<{ id: string }>;
  value: number;
}>;

// Platform-agnostic input for {@link aggregatePayCardBalance}
export type PayCardPortfolioPort = Readonly<{
  stablecoins: readonly PayCardStablecoin[];
  filter: PayCardBalanceFilter;
  isLoading: boolean;
  isError: boolean;
  formatCountervalue: (value: number) => FormattedValue;
}>;

export type PayCardBalanceProps = PayCardBalanceData &
  Readonly<{
    labels: PayCardBalanceLabels;
  }>;

export type PayCardBalanceViewProps =
  | Readonly<{
      displayMode: "empty";
      labels: PayCardBalanceLabels;
    }>
  | Readonly<{
      displayMode: "funded";
      balance: number;
      formatCountervalue: (value: number) => FormattedValue;
      filter: PayCardBalanceFilter;
      isLoading: boolean;
    }>;
