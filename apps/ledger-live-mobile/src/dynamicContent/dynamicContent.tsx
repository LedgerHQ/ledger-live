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
  location: LocationContentCard;
  title: string;
  link: string;
  image?: string;
};

export type WalletContentCard = ContentCard & {
  tag: string;
  background?: BackgroundType;
};

export type AssetContentCard = ContentCard & {
  asset: string;
};

export const filterByPage = (array: BrazeContentCard[], page: string) =>
  array.filter(elem => elem.extras.location === page);

export const mapAsWalletContentCard = (card: BrazeContentCard) =>
  ({
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
    title: card.extras.title,
    location: LocationContentCard.Asset,
    image: card.extras.image,
    link: card.extras.link,
    asset: card.extras.asset,
  } as AssetContentCard);

const useDynamicContent = () => {
  // const dynamicContentFeature = useFeature("dynamicContent");

  const assetsCards = useSelector(assetsCardsSelector);
  const walletCards = useSelector(walletCardsSelector);

  return { walletCards, assetsCards };
};

export default useDynamicContent;
