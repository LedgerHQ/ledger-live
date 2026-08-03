import { useCallback, useEffect, useMemo, useRef } from "react";
import * as braze from "@braze/web-sdk";
import { useSelector } from "LLD/hooks/redux";
import { desktopContentCardSelector } from "~/renderer/reducers/dynamicContent";
import { trackingEnabledSelector } from "~/renderer/reducers/settings";

export function useGenericAwarenessModalBrazeLogging(
  contentCardId: string | undefined,
  isOpen: boolean,
) {
  const desktopCards = useSelector(desktopContentCardSelector);
  const isTrackedUser = useSelector(trackingEnabledSelector);
  const hasLoggedImpressionRef = useRef(false);

  const brazeCard = useMemo(
    () => (contentCardId ? desktopCards.find(card => card.id === contentCardId) : undefined),
    [contentCardId, desktopCards],
  );

  useEffect(() => {
    if (!isOpen || !brazeCard) {
      hasLoggedImpressionRef.current = false;
      return;
    }

    if (hasLoggedImpressionRef.current) {
      return;
    }

    hasLoggedImpressionRef.current = true;
    if (isTrackedUser) {
      braze.logContentCardImpressions([brazeCard]);
    }
  }, [brazeCard, isOpen, isTrackedUser]);

  const logClick = useCallback(() => {
    if (isTrackedUser && brazeCard) {
      braze.logContentCardClick(brazeCard);
    }
  }, [brazeCard, isTrackedUser]);

  const logDismiss = useCallback(() => {
    if (isTrackedUser && brazeCard) {
      braze.logCardDismissal(brazeCard);
    }
  }, [brazeCard, isTrackedUser]);

  return { logClick, logDismiss };
}
