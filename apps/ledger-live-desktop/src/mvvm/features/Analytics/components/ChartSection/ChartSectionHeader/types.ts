import type { FormattedValue } from "@ledgerhq/lumen-ui-react";
import type { ChartVariationStatus } from "../types";

export type ChartSectionHeaderViewModel = Readonly<{
  totalBalanceLabel: string;
  balance: number;
  balanceAvailable: boolean;
  isLoading: boolean;
  variationStatus: ChartVariationStatus;
  balanceFormatter: (value: number) => FormattedValue;
  discreet: boolean;
  percentageValue: number;
  variationText: string;
  rangeLabel: string;
  scrubDateLabel: string | undefined;
}>;
