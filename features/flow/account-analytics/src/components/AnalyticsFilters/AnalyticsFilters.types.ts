import type { AccountAnalyticsLabels } from "../../AccountAnalytics.types";
import type { AnalyticsAccount, AnalyticsAsset, AnalyticsSelection } from "../../types";

export type AnalyticsFiltersProps = Readonly<{
  assets: readonly AnalyticsAsset[];
  accounts: readonly AnalyticsAccount[];
  selection: AnalyticsSelection;
  labels: Pick<AccountAnalyticsLabels, "assets" | "accounts" | "allAssets" | "allAccounts">;
  selectAsset: (assetId: string | null) => void;
  selectAccount: (accountId: string | null) => void;
}>;
