enum LocationContentCard {
  Wallet = "wallet",
  Asset = "asset",
  Learn = "learn",
  NotificationCenter = "notification_center",
}

enum Background {
  purple = "purple",
  red = "red",
}

type ContentCard = {
  id: string;
  location: LocationContentCard;
  title: string;
  link?: string;
  image?: string;
  tag: string;
  createdAt: number;
  order?: number;
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

type NotificationContentCard = ContentCard & {
  cta?: string;
  createdAt: number;
  viewed: boolean;
};

export type {
  ContentCard,
  AssetContentCard,
  WalletContentCard,
  NotificationContentCard,
  LearnContentCard,
};
export { LocationContentCard, Background };
