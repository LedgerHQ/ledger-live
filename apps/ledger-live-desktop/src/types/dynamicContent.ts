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
  createdAt: Date;
  url?: string;
  path?: string;
  image?: string;
  onClickOnSlide?: (cardId: string) => void;
  order?: number;
};

export type PortfolioContentCard = ContentCard;
export type NotificationContentCard = ContentCard & {
  cta: string;
  viewed: boolean;
};
