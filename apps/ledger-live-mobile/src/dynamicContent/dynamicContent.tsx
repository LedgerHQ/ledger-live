import { useDispatch, useSelector } from "react-redux";
import { ContentCard as BrazeContentCard } from "react-native-appboy-sdk";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useCallback } from "react";
import { useBrazeContentCard } from "./brazeContentCard";
import {
  assetsCardsSelector,
  dismissedCardssSelector,
  walletCardsSelector,
} from "../reducers/dynamicContent";
import {
  AssetContentCard,
  Background,
  LocationContentCard,
  WalletContentCard,
} from "./types";
import { setDismissCard } from "../actions/dynamicContent";

export const filterByPage = (array: BrazeContentCard[], page: string) =>
  array.filter(elem => elem.extras.location === page);

export const mapAsWalletContentCard = (card: BrazeContentCard) =>
  ({
    id: card.id,
    tag: card.extras.tag,
    title: card.extras.title,
    location: LocationContentCard.Wallet,
    image: card.extras.image,
    link: card.extras.link,
    background:
      card.extras.image ||
      Background[card.extras.background as Background] ||
      Background.purple,
  } as WalletContentCard);

export const mapAsAssetContentCard = (card: BrazeContentCard) =>
  ({
    id: card.id,
    tag: card.extras.tag,
    title: card.extras.title,
    location: LocationContentCard.Asset,
    image: card.extras.image,
    link: card.extras.link,
    cta: card.extras.cta,
    assets: card.extras.assets,
  } as AssetContentCard);

const useDynamicContent = () => {
  // const dynamicContentFeature = useFeature("dynamicContent");
  const dispatch = useDispatch();
  const { logClickCard, logDismissCard, logImpressionCard } =
    useBrazeContentCard();

  const assetsCards = useSelector(assetsCardsSelector);
  const walletCards = useSelector(walletCardsSelector);
  const hiddenCards: string[] = useSelector(dismissedCardssSelector);

  const getAssetCardByIdOrTicker = useCallback(
    (currency: CryptoOrTokenCurrency): AssetContentCard | undefined => {
      if (!currency) {
        return undefined;
      }

      return assetsCards
        .filter((ac: AssetContentCard) => !hiddenCards.includes(ac.id))
        .find(
          (ac: AssetContentCard) =>
            ac.assets.toLowerCase().includes(currency.id.toLowerCase()) ||
            ac.assets.toUpperCase().includes(currency.ticker.toUpperCase()),
        );
    },
    [assetsCards, hiddenCards],
  );

  const dismissCard = (cardId: string) => dispatch(setDismissCard(cardId));

  return {
    walletCards,
    assetsCards,
    getAssetCardByIdOrTicker,
    logClickCard,
    logDismissCard,
    logImpressionCard,
    dismissCard,
  };
};

export default useDynamicContent;
