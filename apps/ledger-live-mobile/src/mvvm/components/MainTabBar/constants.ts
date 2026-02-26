import { NavigatorName } from "~/const";

export const LABELKEY_MAP: Partial<Record<string, string>> = {
  [NavigatorName.Portfolio]: "mainNavigation.home",
  [NavigatorName.Swap]: "mainNavigation.swap",
  [NavigatorName.Earn]: "mainNavigation.earn",
  [NavigatorName.CardTab]: "mainNavigation.card",
};

export const TRACKING_MENUENTRY_EVENT = "menuentry_clicked";

export const TRACKING_LABEL_MAP: Partial<Record<string, string>> = {
  [NavigatorName.Portfolio]: "Wallet",
  [NavigatorName.Swap]: "Swap",
  [NavigatorName.Earn]: "Earn",
  [NavigatorName.CardTab]: "Card",
};
