import * as braze from "@braze/web-sdk";
import { ClassicCard } from "@braze/web-sdk";
import { generateAnonymousId } from "@ledgerhq/live-common/braze/anonymousUsers";
import { getEnv } from "@ledgerhq/live-env";
import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";

import { getBrazeConfig } from "~/braze-setup";
import getUser from "~/helpers/user";
import {
  ActionContentCard,
  ContentCard as LedgerContentCard,
  LocationContentCard,
  NotificationContentCard,
  Platform,
  PortfolioContentCard,
} from "~/types/dynamicContent";
import {
  setActionCards,
  setDesktopCards,
  setNotificationsCards,
  setPortfolioCards,
} from "../actions/dynamicContent";
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

export const mapAsActionContentCard = (card: ClassicCard): ActionContentCard => ({
  created: card.created,
  description: card.extras?.description,
  id: String(card.id),
  image: card.extras?.image,
  link: card.extras?.link,
  location: LocationContentCard.Action,
  mainCta: card.extras?.mainCta,
  order: parseInt(card.extras?.order) ? parseInt(card.extras?.order) : undefined,
  secondaryCta: card.extras?.secondaryCta,
  title: card.extras?.title,
});

export const mapAsPortfolioContentCard = (card: ClassicCard): PortfolioContentCard => ({
  created: card.created,
  cta: card.extras?.cta,
  description: card.extras?.description,
  id: String(card.id),
  image: card.extras?.image,
  location: LocationContentCard.Portfolio,
  order: parseInt(card.extras?.order) ? parseInt(card.extras?.order) : undefined,
  path: card.extras?.path,
  tag: card.extras?.tag,
  title: card.extras?.title,
  url: card.extras?.url,
});

export const mapAsNotificationContentCard = (card: ClassicCard): NotificationContentCard => ({
  created: card.created,
  cta: card.extras?.cta,
  description: card.extras?.description,
  id: String(card.id),
  location: LocationContentCard.NotificationCenter,
  order: parseInt(card.extras?.order) ? parseInt(card.extras?.order) : undefined,
  path: card.extras?.path,
  title: card.extras?.title,
  url: card.extras?.url,
  viewed: card.viewed,
});

/**
 * TODO put this effectful logic into a provider instead
 */
export async function useBraze() {
  const dispatch = useDispatch();
  const devMode = useSelector(developerModeSelector);
  const contentCardsDissmissed = useSelector(dismissedContentCardsSelector);
  const isTrackedUser = useSelector(trackingEnabledSelector);
  const anonymousBrazeId = useRef(useSelector(anonymousBrazeIdSelector));

  const initBraze = useCallback(async () => {
    const user = await getUser();
    const brazeConfig = getBrazeConfig();
    const isPlaywright = !!getEnv("PLAYWRIGHT_RUN");

    if (!anonymousBrazeId.current) {
      anonymousBrazeId.current = generateAnonymousId();
      dispatch(setAnonymousBrazeId(anonymousBrazeId.current));
    }

    const isInitialized = braze.initialize(brazeConfig.apiKey, {
      baseUrl: brazeConfig.endpoint,
      allowUserSuppliedJavascript: true,
      enableHtmlInAppMessages: true,
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

    if (user) braze.changeUser(isTrackedUser ? user.id : anonymousBrazeId.current);

    braze.requestContentCardsRefresh();

    braze.subscribeToContentCardsUpdates(cards => {
      const desktopCards = getDesktopCards(cards);
      const dismissedCardIds = Object.keys(contentCardsDissmissed);
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

      const notificationsCards = filterByPage(
        filteredDesktopCards,
        LocationContentCard.NotificationCenter,
      )
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        .map(card => mapAsNotificationContentCard(card as ClassicCard))
        .sort(compareCards);

      dispatch(setDesktopCards(filteredDesktopCards));
      dispatch(setPortfolioCards(portfolioCards));
      dispatch(setActionCards(actionCards));
      dispatch(setNotificationsCards(notificationsCards));
    });

    braze.automaticallyShowInAppMessages();
    braze.openSession();
  }, [dispatch, devMode, isTrackedUser, contentCardsDissmissed, anonymousBrazeId]);

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
