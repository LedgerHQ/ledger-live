import Braze from "@braze/react-native-sdk";
import {
  createBrazePendingRefresh,
  type BrazePendingRefresh,
} from "@ledgerhq/live-common/braze/identityLifecycle";
import { useCallback, useEffect, useRef } from "react";
import { useDynamicContentLogic } from "~/dynamicContent/useDynamicContentLogic";

export function useBrazeContentCardsProviderViewModel() {
  const { updateDynamicContent, clearOldDismissedContentCards, setDynamicContentLoading } =
    useDynamicContentLogic();
  const updateDynamicContentRef = useRef(updateDynamicContent);
  const clearOldDismissedContentCardsRef = useRef(clearOldDismissedContentCards);
  const subscriptionRef = useRef<ReturnType<typeof Braze.addListener> | null>(null);
  const pendingRefreshRef = useRef<BrazePendingRefresh | null>(null);
  const subscriptionEpochRef = useRef(0);

  useEffect(() => {
    updateDynamicContentRef.current = updateDynamicContent;
    clearOldDismissedContentCardsRef.current = clearOldDismissedContentCards;
  }, [clearOldDismissedContentCards, updateDynamicContent]);

  const handleContentCardsUpdated = useCallback(
    (event: Braze.ContentCardsUpdatedEvent, subscriptionEpoch: number) => {
      if (subscriptionEpoch !== subscriptionEpochRef.current) return;

      const pendingRefresh = pendingRefreshRef.current;

      try {
        updateDynamicContentRef.current(event.cards);
        pendingRefresh?.resolve();
      } catch (error) {
        setDynamicContentLoading(false);
        pendingRefresh?.reject(error);
        console.warn("Error updating dynamic content", error);
      } finally {
        pendingRefreshRef.current = null;
      }
    },
    [setDynamicContentLoading],
  );

  const ensureSubscription = useCallback(() => {
    if (subscriptionRef.current) return;

    const subscriptionEpoch = subscriptionEpochRef.current;
    subscriptionRef.current = Braze.addListener(Braze.Events.CONTENT_CARDS_UPDATED, event =>
      handleContentCardsUpdated(event, subscriptionEpoch),
    );
  }, [handleContentCardsUpdated]);

  const prepareForIdentityTransition = useCallback(() => {
    subscriptionEpochRef.current += 1;
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    pendingRefreshRef.current?.resolve();
    pendingRefreshRef.current = null;
  }, []);

  const refreshContentCards = useCallback(() => {
    if (pendingRefreshRef.current) {
      return pendingRefreshRef.current.promise;
    }

    const pendingRefresh = createBrazePendingRefresh();
    pendingRefreshRef.current = pendingRefresh;

    setDynamicContentLoading(true);
    ensureSubscription();

    try {
      Braze.requestContentCardsRefresh();
    } catch (error) {
      pendingRefreshRef.current = null;
      setDynamicContentLoading(false);
      pendingRefresh.reject(error);
    }

    return pendingRefresh.promise;
  }, [ensureSubscription, setDynamicContentLoading]);

  useEffect(() => {
    ensureSubscription();
    clearOldDismissedContentCardsRef.current();
    void refreshContentCards().catch(() => {});

    return () => {
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      pendingRefreshRef.current?.resolve();
      pendingRefreshRef.current = null;
    };
  }, [ensureSubscription, refreshContentCards]);

  return { prepareForIdentityTransition, refreshContentCards };
}
