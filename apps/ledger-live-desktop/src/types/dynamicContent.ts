import { ClassicCard } from "@braze/web-sdk";

export enum LocationContentCard {
  Portfolio = "portfolio",
  NotificationCenter = "notification_center",
}

export enum Platform {
  Mobile = "mobile",
  Desktop = "desktop",
}

export type Img = {
  source: string;
  transform: [number, number, number, number];
  size: { width: number; height: number };
};

export type ContentCard = {
  id: string;
  location?: LocationContentCard;
  imgs?: Img[];
  title: React.ReactNode;
  description: React.ReactNode;
  url?: string;
  path?: string;
  image?: string;
  brazeCard?: ClassicCard;
  onClickOnSlide?: (id: string) => void;
};

export type PortfolioContentCard = ContentCard;
export type NotificationContentCard = ContentCard & {
  createdAt: Date;
  cta: string;
  viewed: boolean;
};
