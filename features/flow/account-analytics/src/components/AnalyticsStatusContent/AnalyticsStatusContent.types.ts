import type { AccountAnalyticsLabels } from "../../AccountAnalytics.types";

export type AnalyticsStatusContentProps = Readonly<{
  isError: boolean;
  labels: Pick<AccountAnalyticsLabels, "error" | "unavailable" | "retry">;
  onRetry: () => void;
}>;
