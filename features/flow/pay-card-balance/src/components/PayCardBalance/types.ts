import type { PayCardBalanceFilter } from "@domain/entity-pay-card";
import type { FormattedValue } from "@ledgerhq/lumen-ui-react";

export type PayCardBalanceStatus = "loading" | "error" | "ready";

export type PayCardBalanceLabels = Readonly<{
  emptyTitle: string;
  emptyDescription: string;
}>;

/**
 * Everything the host feeds the hero. The desktop app derives it from the portfolio; LIVE-34898
 * will later provide a shared implementation.
 */
export type PayCardBalanceData = Readonly<{
  status: PayCardBalanceStatus;
  /** Aggregated stablecoin countervalue, in the user's counter currency. */
  stableBalance: number;
  /** Active balance filter (`"all"` or a single stablecoin currencyId). */
  filter: PayCardBalanceFilter;
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
