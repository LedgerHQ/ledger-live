import { ClassicCard } from "@braze/web-sdk";

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
  location: LocationContentCard;
  title: string;
  description: string;
  url?: string;
  path?: string;
  image?: string;
  brazeCard: ClassicCard;
};

export type PortfolioContentCard = ContentCard;
export type NotificationContentCard = ContentCard & {
  createdAt: Date;
  cta: string;
  viewed: boolean;
};
