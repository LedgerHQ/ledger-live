import React from "react";
import { Skeleton } from "@ledgerhq/lumen-ui-react";
import { PnLSection } from "LLD/features/PnL/components/PnLSection";
import { PnlSubHeader } from "../PnlSubHeader";
import { useAnalyticsPnlRendererViewModel } from "./useAnalyticsPnlRendererViewModel";
import type { AnalyticsPnlRendererProps } from "./types";

export function AnalyticsPnlRenderer(props: AnalyticsPnlRendererProps) {
  const { viewModel, status } = useAnalyticsPnlRendererViewModel(props);
  if (status === "loading")
    return <Skeleton className="h-128 w-full rounded-md" data-testid="analytics-pnl-skeleton" />;
  if (status !== "ready")
    return <section data-testid="analytics-pnl-unavailable">{props.statusContent}</section>;
  if (!viewModel.shouldDisplayPnl) return null;
  return (
    <section className="flex flex-col gap-12" data-testid="analytics-pnl">
      <PnlSubHeader onDetailClick={viewModel.dialog.onOpen} />
      <PnLSection viewModel={viewModel} direction="row" />
    </section>
  );
}
