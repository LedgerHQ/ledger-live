enum LocationContentCard {
  Wallet = "wallet",
  Asset = "asset",
  Learn = "learn",
}

enum Background {
  purple = "purple",
  red = "red",
}

type ContentCard = {
  id: string;
  location: LocationContentCard;
  title: string;
  link: string;
  image?: string;
  tag: string;
};

type WalletContentCard = ContentCard & {
  background?: Background;
};

type AssetContentCard = ContentCard & {
  assets: string;
  cta: string;
  displayOnEveryAssets?: boolean;
};

type LearnContentCard = ContentCard;

export type {
  ContentCard,
  AssetContentCard,
  WalletContentCard,
  LearnContentCard,
};
export { LocationContentCard, Background };
