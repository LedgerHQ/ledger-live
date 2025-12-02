import type { JSX } from "react";

export enum Entry {
  magiceden = "magiceden",
  opensea = "opensea",
}

export enum AnalyticsPage {
  Account = "Account",
}

export type EntryPointNft = Record<
  keyof typeof Entry,
  {
    enabled: boolean;
    page: AnalyticsPage;
    component: () => JSX.Element;
  }
>;
