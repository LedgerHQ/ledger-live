import type { AnalyticsPnlRenderProps } from "@features/flow-account-analytics/web";
import type { AccountLike } from "@ledgerhq/types-live";

export type AnalyticsPnlRendererProps = AnalyticsPnlRenderProps &
  Readonly<{ positions: readonly AccountLike[] }>;
