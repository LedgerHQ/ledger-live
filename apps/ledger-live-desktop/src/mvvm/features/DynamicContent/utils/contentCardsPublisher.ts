import * as braze from "@braze/web-sdk";
import { ClassicCard } from "@braze/web-sdk";
import { processGenericAwarenessModalBrazeCards } from "@ledgerhq/live-common/genericAwarenessModal";
import type { AppDispatch } from "~/state-manager/configureStore";
import { ContentCardsType, LocationContentCard, Platform } from "~/types/dynamicContent";
import {
  setActionCards,
  setCategoriesCards,
  setDesktopCards,
  setNotificationsCards,
  setPortfolioCards,
  setBottomPortfolioCards,
} from "~/renderer/actions/dynamicContent";
import {
  filterDismissedGenericAwarenessModalContentCards,
  setGenericAwarenessModalContentCards,
} from "~/renderer/reducers/genericAwarenessModalSlice";
import {
  compareCards,
  filterByPage,
  filterByType,
  mapAsActionContentCard,
  mapAsBottomPortfolioContentCard,
  mapAsCategoryContentCard,
  mapAsNotificationContentCard,
  mapAsPortfolioContentCard,
} from "~/renderer/hooks/useBraze";

const getDesktopCards = (elem: braze.ContentCards) =>
  elem.cards.filter(card => card.extras?.platform === Platform.Desktop);

export const publishDesktopContentCards = (
  dispatch: AppDispatch,
  cards: braze.ContentCards,
  dismissedCardIds: string[],
) => {
  const desktopCards = getDesktopCards(cards);
  const hiddenCardIds = new Set(dismissedCardIds);
  const filteredDesktopCards = desktopCards.filter(card => !hiddenCardIds.has(String(card.id)));

  const portfolioCards = filterByPage(filteredDesktopCards, LocationContentCard.Portfolio)
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    .map(card => mapAsPortfolioContentCard(card as ClassicCard))
    .sort(compareCards);

  const actionCards = filterByPage(filteredDesktopCards, LocationContentCard.Action)
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    .map(card => mapAsActionContentCard(card as ClassicCard))
    .sort(compareCards);

  const bottomPortfolioCards = filterByPage(
    filteredDesktopCards,
    LocationContentCard.BottomPortfolio,
  )
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    .map(card => mapAsBottomPortfolioContentCard(card as ClassicCard))
    .sort(compareCards);

  const notificationsCards = filterByPage(
    filteredDesktopCards,
    LocationContentCard.NotificationCenter,
  )
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    .map(card => mapAsNotificationContentCard(card as ClassicCard))
    .sort(compareCards);

  const categoriesCards = filterByType(filteredDesktopCards, ContentCardsType.category)
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    .map(card => mapAsCategoryContentCard(card as ClassicCard))
    .filter(card => !!card.categoryId)
    .sort(compareCards);

  const genericAwarenessModalBrazeCardsFromBraze = filterByPage(
    filteredDesktopCards,
    LocationContentCard.GenericAwarenessModal,
  ).map(card => ({
    id: String(card.id),
    extras: card.extras,
  }));

  const genericAwarenessModalContentCards = filterDismissedGenericAwarenessModalContentCards(
    processGenericAwarenessModalBrazeCards(genericAwarenessModalBrazeCardsFromBraze),
    dismissedCardIds,
  );

  dispatch(setDesktopCards(filteredDesktopCards));
  dispatch(setPortfolioCards(portfolioCards));
  dispatch(setBottomPortfolioCards(bottomPortfolioCards));
  dispatch(setActionCards(actionCards));
  dispatch(setNotificationsCards(notificationsCards));
  dispatch(setCategoriesCards(categoriesCards));
  dispatch(setGenericAwarenessModalContentCards(genericAwarenessModalContentCards));
};
