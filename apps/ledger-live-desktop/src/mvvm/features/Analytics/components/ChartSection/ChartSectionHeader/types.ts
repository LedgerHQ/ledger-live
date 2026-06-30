import type { FormattedValue } from "@ledgerhq/lumen-ui-react";

export type ChartSectionHeaderViewModel = Readonly<{
  balance: number;
  balanceAvailable: boolean;
  isLoading: boolean;
  balanceFormatter: (value: number) => FormattedValue;
  discreet: boolean;
  percentageValue: number;
  variationText: string;
  rangeLabel: string;
}>;
