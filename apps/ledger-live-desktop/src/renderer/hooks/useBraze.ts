import * as braze from "@braze/web-sdk";
import { ClassicCard } from "@braze/web-sdk";
import { parseOrder, sanitizeExtras } from "@ledgerhq/live-common/braze/contentCardExtras";
import { appendDeeplinkLocationIfDefined } from "@ledgerhq/live-common/deeplinks/index";
import { ALWAYS_ON_CATEGORY_ID } from "LLD/features/DynamicContent/utils/constants";
import type { AppDispatch } from "~/state-manager/configureStore";
import {
  ActionContentCard,
  CategoryContentCard,
  ContentCard as LedgerContentCard,
  ContentCardsLayout,
  ContentCardsType,
  LocationContentCard,
  NotificationContentCard,
  Platform,
  PortfolioContentCard,
} from "~/types/dynamicContent";
import { processGenericAwarenessModalBrazeCards } from "@ledgerhq/live-common/genericAwarenessModal";
import {
  setActionCards,
  setCategoriesCards,
  setDesktopCards,
  setNotificationsCards,
  setPortfolioCards,
  setBottomPortfolioCards,
} from "../actions/dynamicContent";
import {
  filterDismissedGenericAwarenessModalContentCards,
  setGenericAwarenessModalContentCards,
} from "../reducers/genericAwarenessModalSlice";

const getDesktopCards = (elem: braze.ContentCards) =>
  elem.cards.filter(card => card.extras?.platform === Platform.Desktop);

export const filterByPage = (array: braze.Card[], page: LocationContentCard) =>
  array.filter(card => card.extras?.location === page);

export const filterByType = (array: braze.Card[], type: ContentCardsType) =>
  array.filter(card => card.extras?.type === type);

export const compareCards = (a: LedgerContentCard, b: LedgerContentCard) => {
  if (a.order && !b.order) {
    return -1;
  }
  if (!a.order && b.order) {
    return 1;
  }
  if (a.created && b.created && ((!a.order && !b.order) || a.order === b.order)) {
    return b.created.getTime() - a.created.getTime();
  }
  return (a.order || 0) - (b.order || 0);
};

export { parseOrder, sanitizeExtras };

export const mapAsActionContentCard = (card: ClassicCard): ActionContentCard => ({
  created: card.updated ?? null,
  description: card.extras?.description,
  id: String(card.id),
  image: card.extras?.image,
  image_background: card.extras?.image_background,
  icon: card.extras?.icon,
  link: appendDeeplinkLocationIfDefined(card.extras?.link, LocationContentCard.Action),
  location: LocationContentCard.Action,
  mainCta: card.extras?.mainCta,
  order: parseOrder(card.extras?.order),
  secondaryCta: card.extras?.secondaryCta,
  title: card.extras?.title,
});

const mapBrazeCardToPortfolioContentCard = (
  card: ClassicCard,
  location: LocationContentCard.Portfolio | LocationContentCard.BottomPortfolio,
): PortfolioContentCard => ({
  created: card.updated ?? null,
  cta: card.extras?.cta,
  description: card.extras?.description,
  id: String(card.id),
  image: card.extras?.image,
  image_background: card.extras?.image_background,
  icon: card.extras?.icon,
  location,
  order: parseOrder(card.extras?.order),
  path: card.extras?.path,
  tag: card.extras?.tag,
  picto: card.extras?.picto,
  title: card.extras?.title,
  url: appendDeeplinkLocationIfDefined(card.extras?.url || card.extras?.link, location),
});

export const mapAsPortfolioContentCard = (card: ClassicCard): PortfolioContentCard =>
  mapBrazeCardToPortfolioContentCard(card, LocationContentCard.Portfolio);

export const mapAsBottomPortfolioContentCard = (card: ClassicCard): PortfolioContentCard =>
  mapBrazeCardToPortfolioContentCard(card, LocationContentCard.BottomPortfolio);

export const mapAsCategoryContentCard = (card: ClassicCard): CategoryContentCard => {
  const location =
    card.extras?.id === ALWAYS_ON_CATEGORY_ID
      ? LocationContentCard.Portfolio
      : // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        (card.extras?.location as LocationContentCard);
  const isAlwaysOnHardwareCarousel =
    card.extras?.id === ALWAYS_ON_CATEGORY_ID &&
    card.extras?.cardsLayout === ContentCardsLayout.carousel &&
    card.extras?.cardsType === ContentCardsType.smallSquare;

  return {
    id: String(card.id),
    categoryId: card.extras?.id,
    location,
    created: card.updated ?? null,
    viewed: card.viewed,
    order: parseOrder(card.extras?.order),
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    cardsLayout: card.extras?.cardsLayout as ContentCardsLayout,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    cardsType: card.extras?.cardsType as ContentCardsType,
    type: ContentCardsType.category,
    title: card.extras?.title,
    description: card.extras?.description,
    link: appendDeeplinkLocationIfDefined(card.extras?.link, location),
    cta: card.extras?.cta,
    isDismissable: card.extras?.isDismissable === "true" || isAlwaysOnHardwareCarousel,
    hasPagination: card.extras?.hasPagination === "true",
    centeredText: card.extras?.centeredText === "true",
    extras: card.extras,
  };
};

export const mapAsNotificationContentCard = (card: ClassicCard): NotificationContentCard => ({
  created: card.updated ?? null,
  cta: card.extras?.cta,
  description: card.extras?.description,
  id: String(card.id),
  location: LocationContentCard.NotificationCenter,
  order: parseOrder(card.extras?.order),
  path: card.extras?.path,
  title: card.extras?.title,
  url: appendDeeplinkLocationIfDefined(card.extras?.url, LocationContentCard.NotificationCenter),
  viewed: card.viewed,
});

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
