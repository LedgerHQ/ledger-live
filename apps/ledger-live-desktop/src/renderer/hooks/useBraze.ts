import { useEffect, useCallback } from "react";
import * as braze from "@braze/web-sdk";
import { ClassicCard } from "@braze/web-sdk";
import { getBrazeConfig } from "~/braze-setup";
import {
  ContentCard as LedgerContentCard,
  LocationContentCard,
  PortfolioContentCard,
  NotificationContentCard,
  Platform,
} from "~/types/dynamicContent";
import { useDispatch, useSelector } from "react-redux";
import { setNotificationsCards, setPortfolioCards } from "../actions/dynamicContent";
import getUser from "~/helpers/user";
import { developerModeSelector } from "../reducers/settings";
import { getEnv } from "@ledgerhq/live-env";

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

export const mapAsPortfolioContentCard = (card: ClassicCard): PortfolioContentCard => ({
  id: String(card.id),
  title: card.extras?.title,
  description: card.extras?.description,
  location: LocationContentCard.Portfolio,
  image: card.extras?.image,
  link: card.extras?.link,
  created: card.created as Date,
  cta: card.extras?.cta,
  dismissCta: card.extras?.dismissCta,
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

  const initBraze = useCallback(async () => {
    const user = await getUser();
    const brazeConfig = getBrazeConfig();
    const isPlaywright = !!getEnv("PLAYWRIGHT_RUN");

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

    if (user) {
      braze.changeUser(user.id);
    }

    braze.requestPushPermission();

    braze.requestContentCardsRefresh();

    braze.subscribeToContentCardsUpdates(cards => {
      const desktopCards = getDesktopCards(cards);

      const portfolioCards = filterByPage(desktopCards, LocationContentCard.Portfolio)
        .map(card => mapAsPortfolioContentCard(card as ClassicCard))
        .sort(compareCards);

      const notificationsCards = filterByPage(desktopCards, LocationContentCard.NotificationCenter)
        .map(card => mapAsNotificationContentCard(card as ClassicCard))
        .sort(compareCards);

      dispatch(setPortfolioCards(portfolioCards));
      dispatch(setNotificationsCards(notificationsCards));
    });

    braze.automaticallyShowInAppMessages();
    braze.openSession();
  }, [dispatch, devMode]);

  useEffect(() => {
    initBraze();
  }, [initBraze]);
}
