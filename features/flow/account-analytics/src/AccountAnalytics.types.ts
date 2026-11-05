import type { ReactNode } from "react";
import type {
  AccountAnalyticsViewModel,
  AnalyticsCatalogState,
  AnalyticsQueryContext,
  AnalyticsScope,
  UseAccountAnalyticsViewModelProps,
} from "./types";

export type AnalyticsBalanceRenderProps = Readonly<{
  balance: AccountAnalyticsViewModel["balance"];
  context: AnalyticsQueryContext;
  catalogStatus: AnalyticsCatalogState["status"];
  contextKey: string;
  filters: ReactNode;
  statusContent: ReactNode;
}>;

export type AnalyticsPnlRenderProps = Readonly<{
  scope: AnalyticsScope;
  catalogStatus: AnalyticsCatalogState["status"];
  statusContent: ReactNode;
}>;

export type AccountAnalyticsProps = UseAccountAnalyticsViewModelProps &
  Readonly<{
    renderBalance: (props: AnalyticsBalanceRenderProps) => ReactNode;
    onRefresh: () => void;
    renderPnl: (props: AnalyticsPnlRenderProps) => ReactNode;
  }>;

export type AccountAnalyticsLabels = Readonly<{
  assets: string;
  accounts: string;
  allAssets: string;
  allAccounts: string;
  error: string;
  unavailable: string;
  retry: string;
}>;

export type AccountAnalyticsViewProps = Pick<AccountAnalyticsProps, "renderBalance" | "renderPnl"> &
  Readonly<{
    model: AccountAnalyticsViewModel;
    labels: AccountAnalyticsLabels;
    onRetry: () => void;
    scope: AnalyticsScope;
    catalogStatus: AnalyticsCatalogState["status"];
  }>;
