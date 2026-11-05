import React from "react";
import { AnalyticsFilters } from "./components/AnalyticsFilters/AnalyticsFilters";
import { AnalyticsStatusContent } from "./components/AnalyticsStatusContent/AnalyticsStatusContent";
import type { AccountAnalyticsViewProps } from "./AccountAnalytics.types";

export function AccountAnalyticsView({
  model,
  labels,
  renderBalance,
  renderPnl,
  onRetry,
  scope,
  catalogStatus,
}: AccountAnalyticsViewProps) {
  const filters = (
    <AnalyticsFilters
      assets={model.assets}
      accounts={model.accounts}
      selection={model.selection}
      labels={labels}
      selectAsset={model.selectAsset}
      selectAccount={model.selectAccount}
    />
  );
  return (
    <div className="flex flex-col gap-32" data-testid="account-analytics">
      {renderBalance({
        balance: model.balance,
        context: model.context,
        catalogStatus,
        contextKey: model.contextKey,
        filters,
        statusContent: (
          <AnalyticsStatusContent
            isError={model.balance.status === "error"}
            labels={labels}
            onRetry={onRetry}
          />
        ),
      })}
      {renderPnl({
        scope,
        catalogStatus,
        statusContent: (
          <AnalyticsStatusContent
            isError={catalogStatus === "error"}
            labels={labels}
            onRetry={onRetry}
          />
        ),
      })}
    </div>
  );
}
