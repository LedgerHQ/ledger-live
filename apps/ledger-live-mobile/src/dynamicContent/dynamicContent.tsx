import { useSelector } from "react-redux";
import { ContentCard as BrazeContentCard } from "react-native-appboy-sdk";

import {
  assetsCardsSelector,
  walletCardsSelector,
} from "../reducers/dynamicContent";

export enum LocationContentCard {
  Wallet = "wallet",
  Asset = "asset",
}

enum BackgroundType {
  purple = "purple",
  red = "red",
  neutral = "neutral",
}

type ContentCard = {
  id: string;
  location: LocationContentCard;
  title: string;
  link: string;
  image?: string;
  tag: string;
};

export type WalletContentCard = ContentCard & {
  background?: BackgroundType;
};

export type AssetContentCard = ContentCard & {
  assets: string;
  cta: string;
};

export const filterByPage = (array: BrazeContentCard[], page: string) =>
  array.filter(elem => elem.extras.location === page);

export const mapAsWalletContentCard = (card: BrazeContentCard) =>
  ({
    id: card.id,
    tag: card.extras.title,
    title: card.extras.title,
    location: LocationContentCard.Wallet,
    image: card.extras.image,
    link: card.extras.link,
    background:
      card.extras.image ||
      BackgroundType[card.extras.background as BackgroundType] ||
      BackgroundType.purple,
  } as WalletContentCard);

export const mapAsAssetContentCard = (card: BrazeContentCard) =>
  ({
    id: card.id,
    tag: card.extras.title,
    title: card.extras.title,
    location: LocationContentCard.Asset,
    image: card.extras.image,
    link: card.extras.link,
    cta: card.extras.cta,
    assets: card.extras.assets,
  } as AssetContentCard);

const useDynamicContent = () => {
  // const dynamicContentFeature = useFeature("dynamicContent");

  const assetsCards = useSelector(assetsCardsSelector);
  const walletCards = useSelector(walletCardsSelector);

  function getAssetCardById(currencyId?: string): AssetContentCard | undefined {
    if (!currencyId) {
      return undefined;
    }
    return assetsCards.find((ac: AssetContentCard) =>
      ac.assets.includes(currencyId),
    );
  }

  return { walletCards, assetsCards, getAssetCardById };
};

export default useDynamicContent;
