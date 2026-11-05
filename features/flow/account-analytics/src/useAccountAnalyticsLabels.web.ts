import { useTranslation } from "@shared/i18n";
import type { AccountAnalyticsLabels } from "./AccountAnalytics.types";

export function useAccountAnalyticsLabels(): AccountAnalyticsLabels {
  const { t } = useTranslation();
  return {
    assets: t("accountAnalytics.assets"),
    accounts: t("accountAnalytics.accounts"),
    allAssets: t("accountAnalytics.allAssets"),
    allAccounts: t("accountAnalytics.allAccounts"),
    error: t("accountAnalytics.error"),
    unavailable: t("accountAnalytics.unavailable"),
    retry: t("common.retry"),
  };
}
