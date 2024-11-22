import { ContentCard as BrazeContentCard } from "@braze/react-native-sdk";
import { Size } from "~/contentCards/cards/vertical/types";
import { WidthFactor } from "~/contentCards/layouts/types";

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

enum LandingPageUseCase {
  LP_Recover = "LP_Recover",
  LP_Buy = "LP_Buy",
  LP_Receive = "LP_Receive",
  LP_Swap = "LP_Swap",
  LP_Stake = "LP_Stake",
  LP_Earn = "LP_Earn",
  LP_Referral = "LP_Referral",
  LP_Shop = "LP_Shop",
  LP_Website_Promo = "LP_Website_Promo",
  LP_Discover_1 = "LP_Discover_1",
  LP_Discover_2 = "LP_Discover_2",
  LP_Discover_3 = "LP_Discover_3",
  LP_Wallet_Connect = "LP_Wallet_Connect",
  LP_Security_Key = "LP_Security_Key",
  LP_Generic = "LP_Generic",
  LP_Reborn1 = "LP_Reborn1",
  LP_Reborn2 = "LP_Reborn2",
}

enum ContentCardLocation {
  TopWallet = "top_wallet",
  Wallet = "wallet",
  Asset = "asset",
  Learn = "learn",
  MyLedger = "my_ledger",
  NotificationCenter = "notification_center",
  LandingPageStickyCta = "landing_page_sticky_cta",
}

type AllLocations = ContentCardLocation | LandingPageUseCase;

enum Background {
  purple = "purple",
  red = "red",
}

type ContentCardCommonProperties = {
  id: string;
  categoryId?: string;
  location?: AllLocations;
  createdAt: number;
  viewed: boolean;
  order?: number;
  carouselWidthFactor?: WidthFactor;
  gridWidthFactor?: WidthFactor;
  type?: ContentCardsType;
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
  hasPagination?: boolean;
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

type LandingPageStickyCtaContentCard = ContentCardCommonProperties & {
  cta: string;
  link: string;
  landingPage: LandingPageUseCase;
};

type HorizontalContentCard = ContentCardCommonProperties & {
  tag?: string;
  title?: string;
  link?: string;
  description?: string;
  image?: string;
  gridWidthFactor?: WidthFactor;
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
  filledImage?: boolean;
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
  AllLocations,
  LandingPageStickyCtaContentCard,
};
export {
  ContentCardLocation,
  LandingPageUseCase,
  Background,
  ContentCardsLayout,
  ContentCardsType,
};
