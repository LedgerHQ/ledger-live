import { useEffect, useRef } from "react";
import { useTranslation } from "~/context/Locale";
import { track } from "~/analytics";
import { usePortfolioBalance } from "LLM/hooks/usePortfolioBalance";

export function useSyncIndicator() {
  const { t } = useTranslation();
  const { hasAccounts, syncPhase, listOfErrorAccountNames, errorCurrencyIds } =
    usePortfolioBalance();

  const isError = syncPhase === "failed";
  const isPending = syncPhase === "syncing";

  const prevIsErrorRef = useRef(false);
  useEffect(() => {
    const wasError = prevIsErrorRef.current;
    prevIsErrorRef.current = isError;

    if (!isError || wasError) return;

    for (const currencyId of errorCurrencyIds) {
      track("SyncError", { currency: currencyId });
    }
  }, [isError, errorCurrencyIds]);

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
