import type { FormattedValue } from "@ledgerhq/lumen-ui-react";

export type ChartSectionHeaderViewModel = Readonly<{
  balance: number;
  balanceAvailable: boolean;
  isLoading: boolean;
  shouldDisplayBalanceRefreshRework: boolean;
  balanceFormatter: (value: number) => FormattedValue;
  discreet: boolean;
  percentageText: string;
  variationText: string;
  variationVariant: "positive" | "negative" | "neutral";
  rangeLabel: string;
}>;
