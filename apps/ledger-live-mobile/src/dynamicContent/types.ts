enum ContentCardsType {
  action = "action",
  category = "category",
}

enum ContentCardsLayout {
  unique = "unique",
  carousel = "carousel",
  grid = "grid",
}

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
  categoryId?: string;
  location?: LocationContentCard;
  createdAt: number;
  viewed: boolean;
  order?: number;
};

type CategoryContentCard = ContentCard & {
  cardsLayout: ContentCardsLayout;
  cardsType: ContentCardsType;
  type: ContentCardsType.category;
  title?: string;
  description?: string;
  cta?: string;
  link?: string;
};

type WalletContentCard = ContentCard & {
  tag?: string;
  title?: string;
  link?: string;
  image?: string;
  background?: Background;
};

type AssetContentCard = ContentCard & {
  tag?: string;
  title?: string;
  link?: string;
  image?: string;
  cta?: string;
  displayOnEveryAssets?: boolean;
  assets?: string;
};

type LearnContentCard = ContentCard & {
  tag?: string;
  title?: string;
  link?: string;
  image?: string;
};

type NotificationContentCard = ContentCard & {
  tag?: string;
  title?: string;
  link?: string;
  description?: string;
  cta?: string;
};

export type {
  ContentCard,
  AssetContentCard,
  WalletContentCard,
  NotificationContentCard,
  LearnContentCard,
  CategoryContentCard,
};
export { LocationContentCard, Background, ContentCardsType };
