import { useEffect } from "react";
import * as braze from "@braze/web-sdk";
import { Card } from "@braze/web-sdk";

import { getBrazeConfig } from "~/braze-setup";

type ContentCard = {
  id: string;
  location: LocationContentCard;
  title: string;
  content: string;
  link?: string;
  image?: string;
};

type PortfolioContentCard = ContentCard;

enum LocationContentCard {
  Portfolio = "portfolio",
  NotificationCenter = "notification_center",
}

const getPortfolioCards = (elem: braze.ContentCards) =>
  elem.cards.filter(card => card.extras?.platform === "desktop");

export const mapAsPortfolioContentCard = (card: Card) =>
  ({
    id: card.id,
    title: card.extras?.title,
    content: card.extras?.content,
    location: LocationContentCard.Portfolio,
    image: card.extras?.image,
    link: card.extras?.link,
  } as PortfolioContentCard);

export function useBraze() {
  useEffect(() => {
    const brazeConfig = getBrazeConfig();
    braze.initialize(brazeConfig.apiKey, {
      baseUrl: brazeConfig.endpoint,
      allowUserSuppliedJavascript: true,
      enableLogging: true,
    });
    // braze.changeUser("7d44cb19-eab3-4f85-b1c8-9f79981a35da");
    console.log("IS PUSH SUPPORTED", braze.isPushSupported());
    braze.requestPushPermission(
      (endpoint, publicKey, userAuth) => {
        console.log("SUCCESS", { endpoint, publicKey, userAuth });
      },
      temporaryDenial => {
        console.log("NOT GRANTED - is temporary :", temporaryDenial);
      },
    );

    console.log("IS PERMISSION GRANTED :", braze.isPushPermissionGranted());
    braze.requestContentCardsRefresh();
    braze.subscribeToContentCardsUpdates(function(cards) {
      // cards have been updated
      console.log("CARDS HAVE BEEN UPDATED", cards);

      const portfolioCards = getPortfolioCards(cards).map(card => mapAsPortfolioContentCard(card));
      console.log(portfolioCards);
    });

    console.log("IAM subscription :", braze.automaticallyShowInAppMessages());
    console.log("TO Blocked?:", braze.isPushBlocked());

    braze.automaticallyShowInAppMessages();
    braze.openSession();
  }, []);
}
