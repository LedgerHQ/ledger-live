import { useTranslation } from "~/context/Locale";
import { usePortfolioSyncState } from "LLM/hooks/usePortfolioBalance";

export function useSyncIndicator() {
  const { t } = useTranslation();
  const { hasAccounts, syncPhase, listOfErrorAccountNames, errorCurrencyIds } =
    usePortfolioSyncState();

  const isError = syncPhase === "failed";
  const isPending = syncPhase === "syncing";

  let syncAccessibilityLabel;
  if (isError) {
    syncAccessibilityLabel = t("syncIndicator.accessibilityLabel.error");
  } else if (isPending) {
    syncAccessibilityLabel = t("syncIndicator.accessibilityLabel.syncing");
  } else {
    syncAccessibilityLabel = t("syncIndicator.accessibilityLabel.default");
  }

  return {
    hasAccounts,
    isError,
    isPending,
    listOfErrorAccountNames,
    syncAccessibilityLabel,
    errorCurrencyIds,
  };
}
