export type RefreshOutcome = "success" | "error" | "offline" | null;

export type RefreshStatusLabels = Readonly<{
  refreshing: string;
  upToDate: string;
  syncError: string;
  offline: string;
}>;

export type RefreshStatus = Readonly<{
  isVisible: boolean;
  isRefreshing: boolean;
  outcome: RefreshOutcome;
  labels: RefreshStatusLabels;
}>;
