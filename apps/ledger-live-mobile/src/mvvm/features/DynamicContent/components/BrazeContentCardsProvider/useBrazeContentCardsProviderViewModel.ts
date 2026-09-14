import Braze, { type ContentCard } from "@braze/react-native-sdk";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDynamicContentLogic } from "~/dynamicContent/useDynamicContentLogic";
import { useBrazeEligibilityContext } from "LLM/features/DynamicContent/hooks/useBrazeEligibilityContext";
import {
  filterEligibleContentCards,
  type ContentCardEligibilityEvaluation,
} from "LLM/features/DynamicContent/utils/filterEligibleContentCards";

type PendingRefresh = {
  promise: Promise<void>;
  resolve: () => void;
  reject: (error: unknown) => void;
};

export function useBrazeContentCardsProviderViewModel() {
  const { updateDynamicContent, clearOldDismissedContentCards, setDynamicContentLoading } =
    useDynamicContentLogic();
  const eligibilityContext = useBrazeEligibilityContext();
  const updateDynamicContentRef = useRef(updateDynamicContent);
  const clearOldDismissedContentCardsRef = useRef(clearOldDismissedContentCards);
  const eligibilityContextRef = useRef(eligibilityContext);
  const lastFetchedCardsRef = useRef<ContentCard[] | null>(null);
  const subscriptionRef = useRef<ReturnType<typeof Braze.addListener> | null>(null);
  const pendingRefreshRef = useRef<PendingRefresh | null>(null);
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
  }, []);

  const refreshContentCards = useCallback(() => {
    if (pendingRefreshRef.current) {
      return pendingRefreshRef.current.promise;
    }

    let resolveRefresh: () => void = () => {};
    let rejectRefresh: (error: unknown) => void = () => {};
    const promise = new Promise<void>((resolve, reject) => {
      resolveRefresh = resolve;
      rejectRefresh = reject;
    });

    pendingRefreshRef.current = {
      promise,
      resolve: resolveRefresh,
      reject: rejectRefresh,
    };

    setDynamicContentLoading(true);
    ensureSubscription();

    try {
      Braze.requestContentCardsRefresh();
    } catch (error) {
      pendingRefreshRef.current = null;
      setDynamicContentLoading(false);
      rejectRefresh(error);
    }

    return promise;
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
  }, [eligibilityContext]);

  return {
    prepareForIdentityTransition,
    refreshContentCards,
    lastFetchedCards,
    eligibilityEvaluations,
    eligibilityContext,
  };
}
