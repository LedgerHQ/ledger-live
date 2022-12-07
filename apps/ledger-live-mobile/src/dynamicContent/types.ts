enum LocationContentCard {
  Wallet = "wallet",
  Asset = "asset",
  Discover = "discover",
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

type DiscoverContentCard = ContentCard;

export type {
  ContentCard,
  AssetContentCard,
  WalletContentCard,
  DiscoverContentCard,
};
export { LocationContentCard, Background };
