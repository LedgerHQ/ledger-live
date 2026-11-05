import React, { type ReactNode } from "react";
import type { Portfolio } from "@ledgerhq/types-live";
import type { PortfolioBalanceInfo } from "LLD/hooks/usePortfolioBalanceDisplayState";
import { ChartSectionView } from "./ChartSectionView";
import { useChartSectionViewModel } from "./useChartSectionViewModel";
import type { ChartVariationStatus } from "./types";

type ChartSectionProps = Readonly<{
  balanceInfo: PortfolioBalanceInfo;
  portfolio: Pick<Portfolio, "balanceHistory">;
  isLoading: boolean;
  contextKey?: string;
  isChartLoading?: boolean;
  variationStatus?: ChartVariationStatus;
  filters?: ReactNode;
  plotContent?: ReactNode;
  headerContent?: ReactNode;
}>;

export function ChartSection(props: ChartSectionProps) {
  const viewModel = useChartSectionViewModel(props);
  return (
    <ChartSectionView
      viewModel={viewModel}
      filters={props.filters}
      plotContent={props.plotContent}
      headerContent={props.headerContent}
    />
  );
}
