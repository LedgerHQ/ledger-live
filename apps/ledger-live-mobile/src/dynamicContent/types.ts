enum LocationContentCard {
  Wallet = "wallet",
  Asset = "asset",
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
};

type WalletContentCard = ContentCard & {
  background?: Background;
};

type AssetContentCard = ContentCard & {
  assets: string;
  cta: string;
  displayOnEveryAssets?: boolean;
};

type NotificationContentCard = ContentCard & {
  cta: string;
  createdAt: number;
};

export type {
  AssetContentCard,
  WalletContentCard,
  ContentCard,
  NotificationContentCard,
};
export { LocationContentCard, Background };
