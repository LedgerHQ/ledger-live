import { ContentCard as BrazeContentCard } from "@braze/react-native-sdk";
import { Size } from "~/contentCards/cards/vertical/types";
import { WidthFactor } from "~/contentCards/layouts/carousel";

enum ContentCardsType {
  smallSquare = "small_square",
  mediumSquare = "medium_square",
  bigSquare = "big_square",
  action = "action",
  category = "category",
  hero = "hero",
}

enum ContentCardsLayout {
  unique = "unique",
  carousel = "carousel",
  grid = "grid",
}

enum ContentCardLocation {
  TopWallet = "top_wallet",
  Wallet = "wallet",
  Asset = "asset",
  Learn = "learn",
  MyLedger = "my_ledger",
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
  carouselWidthFactor?: WidthFactor;
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

type HeroContentCard = ContentCardCommonProperties & {
  title?: string;
  image?: string;
  tag?: string;
  cta: string;
  link?: string;
};

type VerticalContentCard = ContentCardCommonProperties & {
  tag?: string;
  title?: string;
  link?: string;
  description?: string;
  image?: string;
  price?: string;
  cta?: string;
  size: Size;
};

type AnyContentCard =
  | CategoryContentCard
  | WalletContentCard
  | AssetContentCard
  | LearnContentCard
  | NotificationContentCard
  | HeroContentCard
  | HorizontalContentCard
  | VerticalContentCard;

export type {
  ContentCardCommonProperties,
  AssetContentCard,
  WalletContentCard,
  NotificationContentCard,
  LearnContentCard,
  CategoryContentCard,
  HorizontalContentCard,
  HeroContentCard,
  VerticalContentCard,
  BrazeContentCard,
  AnyContentCard,
};
export { ContentCardLocation, Background, ContentCardsLayout, ContentCardsType };
