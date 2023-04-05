import { useEffect, useCallback } from "react";
import * as braze from "@braze/web-sdk";
import { ClassicCard } from "@braze/web-sdk";

import { getBrazeConfig } from "~/braze-setup";
import {
  LocationContentCard,
  PortfolioContentCard,
  NotificationContentCard,
  Platform,
} from "~/types/dynamicContent";
import { useDispatch } from "react-redux";
import { setNotificationsCards, setPortfolioCards } from "../actions/dynamicContent";
import getUser from "~/helpers/user";

const getDesktopCards = (elem: braze.ContentCards) =>
  elem.cards.filter(card => card.extras?.platform === Platform.Desktop);

export const filterByPage = (array: braze.Card[], page: LocationContentCard) =>
  array.filter(card => card.extras?.location === page);

export const mapAsPortfolioContentCard = (card: ClassicCard) =>
  ({
    id: card.id,
    title: card.extras?.title,
    description: card.extras?.description,
    location: LocationContentCard.Portfolio,
    image: card.extras?.image,
    url: card.extras?.url,
    path: card.extras?.path,
  } as PortfolioContentCard);

export const mapAsNotificationContentCard = (card: ClassicCard) =>
  ({
    id: card.id,
    title: card.extras?.title,
    description: card.extras?.description,
    location: LocationContentCard.NotificationCenter,
    url: card.extras?.url,
    path: card.extras?.path,
    cta: card.extras?.cta,
    createdAt: card.created,
    viewed: card.viewed,
  } as NotificationContentCard);

export async function useBraze() {
  const dispatch = useDispatch();

  const initBraze = useCallback(async () => {
    const user = await getUser();
    const brazeConfig = getBrazeConfig();

    braze.initialize(brazeConfig.apiKey, {
      baseUrl: brazeConfig.endpoint,
      allowUserSuppliedJavascript: true,
      enableHtmlInAppMessages: true,
      enableLogging: __DEV__,
    });
    if (user) {
      braze.changeUser(user.id);
    }

    braze.requestPushPermission(
      (endpoint, publicKey, userAuth) => {
        console.log("SUCCESS", { endpoint, publicKey, userAuth });
      },
      temporaryDenial => {
        console.log("NOT GRANTED - is temporary :", temporaryDenial);
      },
    );

    braze.requestContentCardsRefresh();

    braze.subscribeToContentCardsUpdates(cards => {
      const desktopCards = getDesktopCards(cards);

      const portfolioCards = filterByPage(desktopCards, LocationContentCard.Portfolio).map(card =>
        mapAsPortfolioContentCard(card as ClassicCard),
      );

      const notificationsCards = filterByPage(
        desktopCards,
        LocationContentCard.NotificationCenter,
      ).map(card => mapAsNotificationContentCard(card as ClassicCard));

      dispatch(setPortfolioCards(portfolioCards));
      dispatch(setNotificationsCards(notificationsCards));
    });

    braze.automaticallyShowInAppMessages();
    braze.openSession();
  }, [dispatch]);

  useEffect(() => {
    initBraze();
  }, [initBraze]);
}
