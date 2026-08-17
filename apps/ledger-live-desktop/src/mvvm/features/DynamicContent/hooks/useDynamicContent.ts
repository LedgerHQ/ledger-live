import * as braze from "@braze/web-sdk";
import { ClassicCard } from "@braze/web-sdk";
import type { Card as BrazeCard } from "@braze/web-sdk";
import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";

import {
  type ContentCardEventProperties,
  type ContentCardInteractionEvent,
} from "@ledgerhq/live-common/braze/contentCardExtras";
import {
  setCategoriesCards,
  setDesktopCards,
  setLocalCategoryCards,
} from "~/renderer/actions/dynamicContent";
import { setDismissedContentCards } from "~/renderer/actions/settings";
import {
  categoriesContentCardFromBrazeSelector,
  categoriesContentCardSelector,
  categoryChildCardsSelector,
  desktopContentCardSelector,
  localCategoriesContentCardSelector,
  localCategoryChildCardsSelector,
} from "~/renderer/reducers/dynamicContent";
import { trackingEnabledSelector } from "~/renderer/reducers/settings";
import type { CategoryContentCard } from "~/types/dynamicContent";
import { trackContentCard } from "../utils/trackContentCard";

export type UseDynamicContentResult = {
  categoriesCards: CategoryContentCard[];
  categoryChildCards: BrazeCard[];
  dismissCard: (cardId: string) => boolean;
  dismissCards: (cardIds: readonly string[]) => boolean;
  logClickCard: (cardId: string) => void;
  trackContentCardEvent: (
    event: ContentCardInteractionEvent,
    properties: ContentCardEventProperties,
  ) => void;
};

export function useDynamicContent(): UseDynamicContentResult {
  const dispatch = useDispatch();
  const categoriesCards = useSelector(categoriesContentCardSelector);
  const categoryChildCards = useSelector(categoryChildCardsSelector);
  const brazeCategoriesCards = useSelector(categoriesContentCardFromBrazeSelector);
  const brazeCards = useSelector(desktopContentCardSelector);
  const localCategoriesCards = useSelector(localCategoriesContentCardSelector);
  const localCategoryChildCards = useSelector(localCategoryChildCardsSelector);
  const isTrackedUser = useSelector(trackingEnabledSelector);

  const localCardIds = useMemo(
    () =>
      new Set([
        ...localCategoriesCards.map(card => card.id),
        ...localCategoryChildCards.map(card => String(card.id)),
      ]),
    [localCategoriesCards, localCategoryChildCards],
  );

  const brazeCardIds = useMemo(
    () =>
      new Set([
        ...brazeCards.map(card => String(card.id)),
        ...brazeCategoriesCards.map(card => card.id),
      ]),
    [brazeCards, brazeCategoriesCards],
  );

  const logDismissToBraze = useCallback(
    (cardId: string) => {
      const brazeCard = brazeCards.find(card => String(card.id) === cardId);
      if (!brazeCard) return;

      if (isTrackedUser) {
        braze.logCardDismissal(brazeCard);
      } else {
        dispatch(setDismissedContentCards({ id: cardId, timestamp: Date.now() }));
      }
    },
    [brazeCards, isTrackedUser, dispatch],
  );

  const dismissCards = useCallback(
    (cardIds: readonly string[]): boolean => {
      const localIds = cardIds.filter(cardId => localCardIds.has(cardId));
      const brazeIds = cardIds.filter(cardId => brazeCardIds.has(cardId));
      if (localIds.length === 0 && brazeIds.length === 0) return false;

      const dismissed = new Set([...localIds, ...brazeIds]);

      if (localIds.length > 0) {
        dispatch(
          setLocalCategoryCards({
            categories: localCategoriesCards.filter(card => !dismissed.has(card.id)),
            childCards: localCategoryChildCards.filter(card => !dismissed.has(String(card.id))),
          }),
        );
      }

      if (brazeIds.length > 0) {
        dispatch(setDesktopCards(brazeCards.filter(card => !dismissed.has(String(card.id)))));
        dispatch(setCategoriesCards(brazeCategoriesCards.filter(card => !dismissed.has(card.id))));
        brazeIds.forEach(cardId => {
          logDismissToBraze(cardId);
        });
      }

      return true;
    },
    [
      dispatch,
      localCardIds,
      brazeCardIds,
      localCategoriesCards,
      localCategoryChildCards,
      brazeCards,
      brazeCategoriesCards,
      logDismissToBraze,
    ],
  );

  const dismissCard = useCallback((cardId: string) => dismissCards([cardId]), [dismissCards]);

  const logClickCard = useCallback(
    (cardId: string) => {
      if (!isTrackedUser) return;

      const brazeCard = brazeCards.find(card => String(card.id) === cardId);
      if (!brazeCard || !(brazeCard instanceof ClassicCard)) return;

      brazeCard.url = brazeCard.url || String(brazeCard.id);
      braze.logContentCardClick(brazeCard);
    },
    [brazeCards, isTrackedUser],
  );

  const trackContentCardEvent = useCallback(
    (event: ContentCardInteractionEvent, properties: ContentCardEventProperties) => {
      if (!isTrackedUser) return;

      trackContentCard(event, properties);
    },
    [isTrackedUser],
  );

  return {
    categoriesCards,
    categoryChildCards,
    dismissCard,
    dismissCards,
    logClickCard,
    trackContentCardEvent,
  };
}
