import { useCallback, useEffect, useRef } from "react";
import useDynamicContent from "~/dynamicContent/useDynamicContent";

export function useGenericAwarenessModalBrazeLogging(
  contentCardId: string | undefined,
  isOpen: boolean,
) {
  const { logImpressionCard, logClickCard, logDismissCard } = useDynamicContent();
  const hasLoggedImpressionRef = useRef(false);

  useEffect(() => {
    if (!isOpen || !contentCardId) {
      hasLoggedImpressionRef.current = false;
      return;
    }

    if (hasLoggedImpressionRef.current) {
      return;
    }

    hasLoggedImpressionRef.current = true;
    logImpressionCard(contentCardId);
  }, [contentCardId, isOpen, logImpressionCard]);

  const logClick = useCallback(() => {
    if (contentCardId) {
      logClickCard(contentCardId);
    }
  }, [contentCardId, logClickCard]);

  const logDismiss = useCallback(() => {
    if (contentCardId) {
      logDismissCard(contentCardId);
    }
  }, [contentCardId, logDismissCard]);

  return { logClick, logDismiss };
}
