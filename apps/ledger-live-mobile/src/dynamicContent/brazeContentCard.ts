import Braze from "@braze/react-native-sdk";
import { useCallback, useMemo, useRef } from "react";
import { useSelector, useDispatch } from "~/context/hooks";
import { track } from "~/analytics";
import { setDismissedContentCard } from "~/actions/settings";
import { trackingEnabledSelector } from "~/reducers/settings";
import { localMobileCardsSelector, localWalletCardsSelector } from "~/reducers/dynamicContent";
import {
  buildContentCardTrackingProperties,
  ContentCardEvent,
  finalizeContentCardEventProperties,
  isCategoryContentCardExtras,
} from "@ledgerhq/live-common/braze/contentCardExtras";

const isLocalCard = (
  cardId: string,
  localMobileCards: Braze.ContentCard[],
  localWalletCardIds: Set<string>,
) => localMobileCards.some(c => c.id === cardId) || localWalletCardIds.has(cardId);

export const useBrazeContentCard = (mobileCards: Braze.ContentCard[]) => {
  const isTrackedUser = useSelector(trackingEnabledSelector);
  const localMobileCards = useSelector(localMobileCardsSelector);
  const localWalletCards = useSelector(localWalletCardsSelector);
  const localWalletCardIds = useMemo(
    () => new Set(localWalletCards.map(c => c.id)),
    [localWalletCards],
  );
  const cardIndex = useMemo(() => {
    const byId = new Map<string, Braze.ContentCard>();
    const categoryExtrasById = new Map<string, Record<string, string>>();
    for (const card of mobileCards) {
      byId.set(card.id, card);
      if (isCategoryContentCardExtras(card.extras) && card.extras.id) {
        categoryExtrasById.set(card.extras.id, card.extras);
      }
    }
    // Local/debug cards (Settings > Debug > Content Cards) aren't in `mobileCards`; index them
    // too so logImpressionCard can find them by id.
    for (const card of localMobileCards) {
      byId.set(card.id, card);
    }
    for (const card of localWalletCards) {
      byId.set(card.id, card as unknown as Braze.ContentCard);
    }
    return { byId, categoryExtrasById };
  }, [mobileCards, localMobileCards, localWalletCards]);
  const cardIndexRef = useRef(cardIndex);
  cardIndexRef.current = cardIndex;
  const dispatch = useDispatch();

  const logDismissCard = useCallback(
    (cardId: string) => {
      if (isTrackedUser) {
        const isLocal = isLocalCard(cardId, localMobileCards, localWalletCardIds);
        if (isLocal) return;
        Braze.logContentCardDismissed(cardId);
      } else {
        dispatch(setDismissedContentCard({ [cardId]: Date.now() }));
      }
    },
    [isTrackedUser, dispatch, localMobileCards, localWalletCardIds],
  );

  const logClickCard = useCallback(
    (cardId: string) => {
      if (!isTrackedUser) return;
      const isLocal = isLocalCard(cardId, localMobileCards, localWalletCardIds);
      if (isLocal) return;
      Braze.logContentCardClicked(cardId);
    },
    [isTrackedUser, localMobileCards, localWalletCardIds],
  );

  const logImpressionCard = useCallback(
    (cardId: string, displayedPosition?: number) => {
      if (!isTrackedUser) return;

      const card = cardIndexRef.current.byId.get(cardId);
      if (!card || isCategoryContentCardExtras(card.extras)) return;

      if (!isLocalCard(cardId, localMobileCards, localWalletCardIds)) {
        Braze.logContentCardImpression(cardId);
      }

      const categoryExtras = card.extras.categoryId
        ? cardIndexRef.current.categoryExtrasById.get(card.extras.categoryId)
        : undefined;
      track(
        ContentCardEvent.Impression,
        finalizeContentCardEventProperties({
          ...buildContentCardTrackingProperties({
            cardExtras: card.extras,
            categoryExtras,
          }),
          displayedPosition,
        }),
      );
    },
    [isTrackedUser, localMobileCards, localWalletCardIds],
  );

  const refreshDynamicContent = () => Braze.requestContentCardsRefresh();

  return {
    logClickCard,
    logDismissCard,
    logImpressionCard,
    refreshDynamicContent,
    Braze,
  };
};
