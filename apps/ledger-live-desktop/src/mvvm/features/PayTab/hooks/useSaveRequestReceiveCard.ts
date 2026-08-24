import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { saveRequestReceiveCard } from "./saveRequestReceiveCard";

/**
 * Returns a guarded callback that saves the request card as a PNG. The guard prevents a second
 * capture from starting while the OS save dialog of a first one is still open.
 */
export function useSaveRequestReceiveCard(ticker: string): () => void {
  const { t } = useTranslation();
  const savingRef = useRef(false);

  return useCallback(() => {
    if (savingRef.current) {
      return;
    }
    savingRef.current = true;
    void saveRequestReceiveCard(ticker, t("payTab.request.saveDialogTitle")).finally(() => {
      savingRef.current = false;
    });
  }, [ticker, t]);
}
