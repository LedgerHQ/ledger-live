export enum LocationContentCard {
  Portfolio = "portfolio",
  NotificationCenter = "notification_center",
}

export type ContentCard = {
  id: string;
  location: LocationContentCard;
  title: string;
  description: string;
  url?: string;
  path?: string;
  image?: string;
};

export type PortfolioContentCard = ContentCard;
export type NotificationContentCard = ContentCard & {
  createdAt: Date;
  cta: string;
  viewed: boolean;
};
