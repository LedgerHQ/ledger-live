import { useEffect, useCallback, useRef } from "react";
import * as braze from "@braze/web-sdk";
import { ClassicCard } from "@braze/web-sdk";
import { getBrazeConfig } from "~/braze-setup";
import {
  ContentCard as LedgerContentCard,
  LocationContentCard,
  PortfolioContentCard,
  NotificationContentCard,
  Platform,
  ActionContentCard,
} from "~/types/dynamicContent";
import { useDispatch, useSelector } from "react-redux";
import {
  setActionCards,
  setNotificationsCards,
  setPortfolioCards,
} from "../actions/dynamicContent";
import getUser from "~/helpers/user";
import {
  developerModeSelector,
  trackingEnabledSelector,
  dismissedContentCardsSelector,
  anonymousBrazeIdSelector,
} from "../reducers/settings";
import { clearDismissedContentCards, setAnonymousBrazeId } from "../actions/settings";
import { getEnv } from "@ledgerhq/live-env";
import { getOldCampaignIds, generateAnonymousId } from "@ledgerhq/live-common/braze/anonymousUsers";

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
  id: String(card.id),
  title: card.extras?.title,
  description: card.extras?.description,
  location: LocationContentCard.Action,
  image: card.extras?.image,
  link: card.extras?.link,
  created: card.created as Date,
  mainCta: card.extras?.mainCta,
  secondaryCta: card.extras?.secondaryCta,
  order: parseInt(card.extras?.order) ? parseInt(card.extras?.order) : undefined,
});

export const mapAsPortfolioContentCard = (card: ClassicCard): PortfolioContentCard => ({
  id: String(card.id),
  title: card.extras?.title,
  description: card.extras?.description,
  location: LocationContentCard.Portfolio,
  image: card.extras?.image,
  url: card.extras?.url,
  path: card.extras?.path,
  created: card.created as Date,
  order: parseInt(card.extras?.order) ? parseInt(card.extras?.order) : undefined,
});

export const mapAsNotificationContentCard = (card: ClassicCard): NotificationContentCard => ({
  id: String(card.id),
  title: card.extras?.title,
  description: card.extras?.description,
  location: LocationContentCard.NotificationCenter,
  url: card.extras?.url,
  path: card.extras?.path,
  cta: card.extras?.cta,
  created: card.created as Date,
  viewed: card.viewed,
  order: parseInt(card.extras?.order) ? parseInt(card.extras?.order) : undefined,
});

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
    dispatch(clearDismissedContentCards(getOldCampaignIds(contentCardsDissmissed)));

    if (!anonymousBrazeId.current) {
      anonymousBrazeId.current = generateAnonymousId();
      dispatch(setAnonymousBrazeId(anonymousBrazeId.current));
    }

    braze.initialize(brazeConfig.apiKey, {
      baseUrl: brazeConfig.endpoint,
      allowUserSuppliedJavascript: true,
      enableHtmlInAppMessages: true,
      enableLogging: __DEV__,
      sessionTimeoutInSeconds: devMode ? 1 : 1800,
    });

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
        .map(card => mapAsPortfolioContentCard(card as ClassicCard))
        .sort(compareCards);

      const actionCards = filterByPage(filteredDesktopCards, LocationContentCard.Action)
        .map(card => mapAsActionContentCard(card as ClassicCard))
        .sort(compareCards);

      const notificationsCards = filterByPage(
        filteredDesktopCards,
        LocationContentCard.NotificationCenter,
      )
        .map(card => mapAsNotificationContentCard(card as ClassicCard))
        .sort(compareCards);

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
}
