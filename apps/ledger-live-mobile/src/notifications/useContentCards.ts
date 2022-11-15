import { useEffect, useState } from "react";
import Braze, {
  ContentCard as BrazeContentCard,
} from "react-native-appboy-sdk";

// TODO: Move type/enum in other file ?

enum LocationContentCard {
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
  description: string;
  title: string;
  image?: string;
  link?: string;
};

type WalletContentCard = ContentCard & {
  tag: string;
  background?: BackgroundType;
};

type AssetContentCard = ContentCard & {
  asset: string;
};

// TODO: Move helpers in other file

const filterByPage = (array: BrazeContentCard[], page: string) =>
  array.filter(elem => elem.extras.location === page);

const mapAsWalletContentCard = (card: BrazeContentCard) =>
  ({
    title: card.extras.title,
    location: LocationContentCard.Wallet,
    description: card.extras.description,
    image: card.extras.image,
    link: card.extras.link,
    background:
      card.extras.image ||
      BackgroundType[card.extras.background as BackgroundType] ||
      BackgroundType.purple,
  } as WalletContentCard);

const mapAsAssetContentCard = (card: BrazeContentCard) =>
  ({
    title: card.extras.title,
    location: LocationContentCard.Asset,
    description: card.extras.description,
    image: card.extras.image,
    link: card.extras.link,
    asset: card.extras.asset,
  } as AssetContentCard);

const HookContentCards = () => {
  const fetchData = async () => {
    // Fetch data from Braze
    const contentCards = await Braze.getContentCards();
    console.log(
      "cards",
      contentCards.map(c => c.extras),
      "count",
      contentCards.length,
    );

    // Filtering v0
    const walletCards = filterByPage(
      contentCards,
      LocationContentCard.Wallet,
    ).map(card => mapAsWalletContentCard(card));

    const assetCards = filterByPage(
      contentCards,
      LocationContentCard.Asset,
    ).map(card => mapAsAssetContentCard(card));

    console.log("walletCards", walletCards.length);
    console.log("assetCards", assetCards.length);
  };

  useEffect(() => {
    Braze.requestContentCardsRefresh();
    fetchData();
  }, []);

  return null;
};

export default HookContentCards;
