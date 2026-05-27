import * as braze from "@braze/web-sdk";
import { ClassicCard } from "@braze/web-sdk";
import { generateAnonymousId } from "@ledgerhq/live-common/braze/anonymousUsers";
import { parseOrder, sanitizeExtras } from "@ledgerhq/live-common/braze/contentCardExtras";
import { appendDeeplinkLocationIfDefined } from "@ledgerhq/live-common/deeplinks/index";
import { getEnv } from "@ledgerhq/live-env";
import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";

import { userIdSelector } from "@ledgerhq/client-ids/store";
import { getBrazeConfig } from "~/braze-setup";
import {
  ActionContentCard,
  ContentCard as LedgerContentCard,
  LocationContentCard,
  NotificationContentCard,
  Platform,
  PortfolioContentCard,
} from "~/types/dynamicContent";
import { processGenericAwarenessModalBrazeCards } from "@ledgerhq/live-common/genericAwarenessModal";
import {
  setActionCards,
  setDesktopCards,
  setNotificationsCards,
  setPortfolioCards,
  setBottomPortfolioCards,
} from "../actions/dynamicContent";
import {
  filterDismissedGenericAwarenessModalContentCards,
  setGenericAwarenessModalContentCards,
} from "../reducers/genericAwarenessModalSlice";
import {
  clearDismissedContentCards,
  purgeExpiredAnonymousUserNotifications,
  setAnonymousBrazeId,
} from "../actions/settings";
import {
  anonymousBrazeIdSelector,
  developerModeSelector,
  dismissedContentCardsSelector,
  trackingEnabledSelector,
} from "../reducers/settings";

const getDesktopCards = (elem: braze.ContentCards) =>
  elem.cards.filter(card => card.extras?.platform === Platform.Desktop);

export const filterByPage = (array: braze.Card[], page: LocationContentCard) =>
  array.filter(card => card.extras?.location === page);

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

/**
 * TODO put this effectful logic into a provider instead
 */
export function useBraze() {
  const dispatch = useDispatch();
  const devMode = useSelector(developerModeSelector);
  const contentCardsDissmissed = useSelector(dismissedContentCardsSelector);
  const isTrackedUser = useSelector(trackingEnabledSelector);
  const anonymousBrazeId = useRef(useSelector(anonymousBrazeIdSelector));
  const userId = useSelector(userIdSelector);

  const initBraze = useCallback(async () => {
    const brazeConfig = getBrazeConfig();
    const isPlaywright = !!getEnv("PLAYWRIGHT_RUN");

    if (!anonymousBrazeId.current) {
      anonymousBrazeId.current = generateAnonymousId();
      dispatch(setAnonymousBrazeId(anonymousBrazeId.current));
    }

    const isInitialized = braze.initialize(brazeConfig.apiKey, {
      baseUrl: brazeConfig.endpoint,
      allowUserSuppliedJavascript: true,
      enableLogging: __DEV__,
      sessionTimeoutInSeconds: devMode ? 1 : 1800,
      appVersion: isTrackedUser ? __APP_VERSION__ : undefined,
    });

    if (!isInitialized) {
      console.warn("Failed to initialize Braze SDK");
      return;
    }

    // If it's playwright, we don't want to fetch content cards
    if (isPlaywright) {
      return;
    }

    braze.changeUser(isTrackedUser ? userId.exportUserIdForBraze() : anonymousBrazeId.current);

    braze.requestContentCardsRefresh();

    braze.subscribeToContentCardsUpdates(cards => {
      const desktopCards = getDesktopCards(cards);
      const dismissedCardIds = Object.keys(contentCardsDissmissed ?? {});
      const filteredDesktopCards = desktopCards.filter(
        card => !dismissedCardIds.includes(String(card.id)),
      );

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

      const genericAwarenessModalBrazeCards = filterByPage(
        filteredDesktopCards,
        LocationContentCard.GenericAwarenessModal,
      )
        .filter(card => {
          const campaignId = card.extras?.campaignId;
          return (
            campaignId === undefined ||
            campaignId === "" ||
            !dismissedCardIds.includes(String(campaignId))
          );
        })
        .map(card => ({
          id: String(card.id),
          extras: card.extras,
        }));

      const genericAwarenessModalContentCards = filterDismissedGenericAwarenessModalContentCards(
        processGenericAwarenessModalBrazeCards(genericAwarenessModalBrazeCards),
        dismissedCardIds,
      );

      dispatch(setDesktopCards(filteredDesktopCards));
      dispatch(setPortfolioCards(portfolioCards));
      dispatch(setBottomPortfolioCards(bottomPortfolioCards));
      dispatch(setActionCards(actionCards));
      dispatch(setNotificationsCards(notificationsCards));
      dispatch(setGenericAwarenessModalContentCards(genericAwarenessModalContentCards));
    });

    braze.automaticallyShowInAppMessages();
    braze.openSession();
  }, [dispatch, devMode, isTrackedUser, contentCardsDissmissed, anonymousBrazeId, userId]);

  useEffect(() => {
    initBraze();
  }, [initBraze]);

  // TODO should there be an interval to periodically purge dismissed cards?
  useEffect(() => {
    dispatch(clearDismissedContentCards({ now: new Date() }));
  }, [dispatch]);

  // TODO should there be an interval to periodically purge old notifications?
  useEffect(() => {
    // If the user is opt-out from analytics, we need to purge expired notifications persisted in the store/offline storage
    if (!isTrackedUser) {
      dispatch(purgeExpiredAnonymousUserNotifications({ now: new Date() }));
    }
  }, [dispatch, isTrackedUser]);
}
