export enum LocationContentCard {
  /** Top carousel on portfolio page (placement "portfolio") */
  Portfolio = "portfolio",
  /** Bottom carousel on portfolio page (placement "bottom_portfolio") */
  BottomPortfolio = "bottom_portfolio",
  Action = "action",
  NotificationCenter = "notification_center",
}

export enum Platform {
  Desktop = "desktop",
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

export type PortfolioContentCard = ContentCard & {
  url?: string;
  path?: string;
  image?: string;
  cta?: string;
  tag?: string;
};
