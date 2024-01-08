import { ContentCard as BrazeContentCard } from "@braze/react-native-sdk";

enum ContentCardsType {
  action = "action",
  category = "category",
}

enum ContentCardsLayout {
  unique = "unique",
  carousel = "carousel",
  grid = "grid",
}

enum ContentCardLocation {
  Wallet = "wallet",
  Asset = "asset",
  Learn = "learn",
  NotificationCenter = "notification_center",
}

enum Background {
  purple = "purple",
  red = "red",
}

type ContentCardCommonProperties = {
  id: string;
  categoryId?: string;
  location?: ContentCardLocation;
  createdAt: number;
  viewed: boolean;
  order?: number;
};

type CategoryContentCard = ContentCardCommonProperties & {
  cardsLayout: ContentCardsLayout;
  cardsType: ContentCardsType;
  type: ContentCardsType.category;
  title?: string;
  description?: string;
  cta?: string;
  link?: string;
  isDismissable?: boolean;
};

type WalletContentCard = ContentCardCommonProperties & {
  tag?: string;
  title?: string;
  link?: string;
  image?: string;
  background?: Background;
};

type AssetContentCard = ContentCardCommonProperties & {
  tag?: string;
  title?: string;
  link?: string;
  image?: string;
  cta?: string;
  displayOnEveryAssets?: boolean;
  assets?: string;
};

type LearnContentCard = ContentCardCommonProperties & {
  tag?: string;
  title?: string;
  link?: string;
  image?: string;
};

type NotificationContentCard = ContentCardCommonProperties & {
  tag?: string;
  title?: string;
  link?: string;
  description?: string;
  cta?: string;
};

type HorizontalContentCard = ContentCardCommonProperties & {
  tag?: string;
  title?: string;
  link?: string;
  description?: string;
  image?: string;
};

type AnyContentCard =
  | CategoryContentCard
  | WalletContentCard
  | AssetContentCard
  | LearnContentCard
  | NotificationContentCard
  | HorizontalContentCard;

export type {
  ContentCardCommonProperties,
  AssetContentCard,
  WalletContentCard,
  NotificationContentCard,
  LearnContentCard,
  CategoryContentCard,
  HorizontalContentCard,
  BrazeContentCard,
  AnyContentCard,
};
export { ContentCardLocation, Background, ContentCardsLayout, ContentCardsType };
