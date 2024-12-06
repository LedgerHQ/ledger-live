export enum LocationContentCard {
  Portfolio = "portfolio",
  Action = "action",
  NotificationCenter = "notification_center",
}

export enum Platform {
  Mobile = "mobile",
  Desktop = "desktop",
}

export type ContentCard = {
  id: string;
  title: string;
  description: string;
  location?: LocationContentCard;
  order?: number;
  created: Date;
  isMock?: boolean;
};

export type ActionContentCard = ContentCard & {
  image?: string;
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
