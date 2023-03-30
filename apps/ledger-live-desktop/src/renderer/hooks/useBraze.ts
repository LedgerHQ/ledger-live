import { useEffect, useCallback } from "react";
import * as braze from "@braze/web-sdk";
import { Card } from "@braze/web-sdk";

import { getBrazeConfig } from "~/braze-setup";
import { LocationContentCard, PortfolioContentCard, ContentCard } from "~/types/dynamicContent";
import { useDispatch } from "react-redux";
import { setPortfolioCards } from "../actions/dynamicContent";
import getUser from "~/helpers/user";

const getPortfolioCards = (elem: braze.ContentCards) =>
  elem.cards.filter(card => card.extras?.platform === "desktop");

export const mapAsPortfolioContentCard = (card: Card) =>
  ({
    id: card.id,
    title: card.extras?.title,
    description: card.extras?.description,
    location: LocationContentCard.Portfolio,
    image: card.extras?.image,
    url: card.extras?.url,
    path: card.extras?.path,
  } as PortfolioContentCard);

export async function useBraze() {
  const dispatch = useDispatch();

  const initBraze = useCallback(async () => {
    const user = await getUser();
    const brazeConfig = getBrazeConfig();
    braze.initialize(brazeConfig.apiKey, {
      baseUrl: brazeConfig.endpoint,
      allowUserSuppliedJavascript: true,
      enableLogging: true,
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
    braze.subscribeToContentCardsUpdates(function(cards) {
      // cards have been updated
      console.log("CARDS HAVE BEEN UPDATED", cards);

      const portfolioCards = getPortfolioCards(cards).map(card => mapAsPortfolioContentCard(card));

      dispatch(setPortfolioCards(portfolioCards));
    });

    braze.automaticallyShowInAppMessages();
    braze.openSession();
  }, [dispatch])
  
  useEffect(() => {
    initBraze()
  }, [initBraze]);
}
