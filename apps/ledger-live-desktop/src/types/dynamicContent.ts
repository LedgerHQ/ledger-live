export enum LocationContentCard {
  /** Top carousel on portfolio page — direct cards and category containers (e.g. alwayson hardware carousel) */
  Portfolio = "portfolio",
  /** Bottom carousel on portfolio page (placement "bottom_portfolio") */
  BottomPortfolio = "bottom_portfolio",
  Action = "action",
  NotificationCenter = "notification_center",
  /** Generic Awareness Modal */
  GenericAwarenessModal = "generic_awareness_modal",
}

export enum Platform {
  Desktop = "desktop",
}

export enum ContentCardsType {
  smallSquare = "small_square",
  mediumSquare = "medium_square",
  bigSquare = "big_square",
  action = "action",
  category = "category",
  hero = "hero",
}

export enum ContentCardsLayout {
  unique = "unique",
  carousel = "carousel",
  grid = "grid",
}

export type ContentCard = {
  id: string;
  title: string;
  description: string;
  location?: LocationContentCard;
  order?: number;
  created: Date | null;
  isMock?: boolean;
  extras?: Record<string, string>;
};

export type ActionContentCard = ContentCard & {
  image?: string;
  image_background?: string;
  icon?: string;
  mainCta?: string;
  link?: string;
  secondaryCta?: string;
};

export type NotificationContentCard = ContentCard & {
  cta: string;
  viewed: boolean;
  url?: string;
  path?: string;
};

/**
 * Container card grouping child cards that share its `categoryId`.
 * Children are kept raw in the store and mapped at render time using `cardsType`.
 */
export type CategoryContentCard = ContentCard & {
  categoryId?: string;
  cardsLayout: ContentCardsLayout;
  cardsType: ContentCardsType;
  type: ContentCardsType.category;
  cta?: string;
  link?: string;
  viewed?: boolean;
  isDismissable?: boolean;
  hasPagination?: boolean;
  centeredText?: boolean;
};

export type PortfolioContentCard = ContentCard & {
  url?: string;
  path?: string;
  image?: string;
  image_background?: string;
  icon?: string;
  cta?: string;
  tag?: string;
  picto?: string;
};
