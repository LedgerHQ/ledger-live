export enum LocationContentCard {
  Portfolio = "portfolio",
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
};

export type PortfolioContentCard = ContentCard & {
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
