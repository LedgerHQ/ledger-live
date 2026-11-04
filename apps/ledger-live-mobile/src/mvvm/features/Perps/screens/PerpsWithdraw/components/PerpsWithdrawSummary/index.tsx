import React from "react";
import { PerpsWithdrawSummaryView } from "./PerpsWithdrawSummaryView";
import {
  usePerpsWithdrawSummaryViewModel,
  type PerpsWithdrawSummaryProps,
} from "./usePerpsWithdrawSummaryViewModel";

export type {
  PerpsWithdrawSummaryParams,
  PerpsWithdrawSummaryProps,
} from "./usePerpsWithdrawSummaryViewModel";

export function PerpsWithdrawSummary(props: PerpsWithdrawSummaryProps) {
  const viewModel = usePerpsWithdrawSummaryViewModel(props);
  return <PerpsWithdrawSummaryView {...viewModel} />;
}
