import Braze, { type ContentCard } from "@braze/react-native-sdk";
import {
  armBrazePendingRefreshTimeout,
  createBrazePendingRefresh,
  type BrazePendingRefresh,
} from "@ledgerhq/live-common/braze/identityLifecycle";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDynamicContentLogic } from "~/dynamicContent/useDynamicContentLogic";
import { useBrazeEligibilityContext } from "LLM/features/DynamicContent/hooks/useBrazeEligibilityContext";
import {
  filterEligibleContentCards,
  type ContentCardEligibilityEvaluation,
} from "LLM/features/DynamicContent/utils/filterEligibleContentCards";

export function useBrazeContentCardsProviderViewModel() {
  const { updateDynamicContent, clearOldDismissedContentCards, setDynamicContentLoading } =
    useDynamicContentLogic();
  const eligibilityContext = useBrazeEligibilityContext();
  const updateDynamicContentRef = useRef(updateDynamicContent);
  const clearOldDismissedContentCardsRef = useRef(clearOldDismissedContentCards);
  const eligibilityContextRef = useRef(eligibilityContext);
  const lastFetchedCardsRef = useRef<ContentCard[] | null>(null);
  const subscriptionRef = useRef<ReturnType<typeof Braze.addListener> | null>(null);
  const pendingRefreshRef = useRef<BrazePendingRefresh | null>(null);
  const subscriptionEpochRef = useRef(0);
  const [lastFetchedCards, setLastFetchedCards] = useState<ContentCard[] | null>(null);
  const [eligibilityEvaluations, setEligibilityEvaluations] = useState<
    ContentCardEligibilityEvaluation[]
  >([]);

  useEffect(() => {
    updateDynamicContentRef.current = updateDynamicContent;
    clearOldDismissedContentCardsRef.current = clearOldDismissedContentCards;
  }, [clearOldDismissedContentCards, updateDynamicContent]);

  useEffect(() => {
    eligibilityContextRef.current = eligibilityContext;
  }, [eligibilityContext]);

  const publishEligibleCards = useCallback((cards: ContentCard[]) => {
    const { eligibleCards, evaluations } = filterEligibleContentCards(
      cards,
      eligibilityContextRef.current,
    );
    setEligibilityEvaluations(evaluations);
    updateDynamicContentRef.current(eligibleCards);
  }, []);

  const handleContentCardsUpdated = useCallback(
    (event: Braze.ContentCardsUpdatedEvent, subscriptionEpoch: number) => {
      if (subscriptionEpoch !== subscriptionEpochRef.current) return;

      const pendingRefresh = pendingRefreshRef.current;

      try {
        lastFetchedCardsRef.current = event.cards;
        setLastFetchedCards(event.cards);
        publishEligibleCards(event.cards);
        pendingRefresh?.resolve();
      } catch (error) {
        setDynamicContentLoading(false);
        pendingRefresh?.reject(error);
        console.warn("Error updating dynamic content", error);
      } finally {
        pendingRefreshRef.current = null;
      }
    },
    [publishEligibleCards, setDynamicContentLoading],
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
    lastFetchedCardsRef.current = null;
    setLastFetchedCards(null);
    setEligibilityEvaluations([]);
    updateDynamicContentRef.current([]);
  }, []);

  const refreshContentCards = useCallback(() => {
    if (pendingRefreshRef.current) {
      return pendingRefreshRef.current.promise;
    }

    const pendingRefresh = createBrazePendingRefresh();
    pendingRefreshRef.current = armBrazePendingRefreshTimeout(pendingRefresh, pendingRefreshRef, {
      onTimeout: () => {
        subscriptionEpochRef.current += 1;
        subscriptionRef.current?.remove();
        subscriptionRef.current = null;
        setDynamicContentLoading(false);
      },
    });

    setDynamicContentLoading(true);
    ensureSubscription();

    try {
      Braze.requestContentCardsRefresh();
    } catch (error) {
      pendingRefreshRef.current?.reject(error);
      pendingRefreshRef.current = null;
      setDynamicContentLoading(false);
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

  useEffect(() => {
    const cards = lastFetchedCardsRef.current;
    if (!cards) return;
    publishEligibleCards(cards);
  }, [eligibilityContext, publishEligibleCards]);

  return {
    prepareForIdentityTransition,
    refreshContentCards,
    lastFetchedCards,
    eligibilityEvaluations,
    eligibilityContext,
  };
}
