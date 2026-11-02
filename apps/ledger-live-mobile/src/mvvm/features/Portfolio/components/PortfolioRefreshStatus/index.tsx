import React from "react";
import { RefreshStatusView } from "LLM/components/RefreshStatus";
import { usePortfolioRefreshStatusViewModel } from "./usePortfolioRefreshStatusViewModel";

export const PortfolioRefreshStatus = () => (
  <RefreshStatusView {...usePortfolioRefreshStatusViewModel()} testID="portfolio-refresh-status" />
);
