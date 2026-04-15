import { NavigatorName } from "~/const";
import { getEarnOrYieldSuffix } from "~/helpers/getStakeLabelLocaleBased";

const LABELKEY_MAP: Partial<Record<string, string>> = {
  [NavigatorName.Portfolio]: "mainNavigation.home",
  [NavigatorName.Swap]: "mainNavigation.swap",
  [NavigatorName.BaanxCardTab]: "mainNavigation.card",
};

export const getLabelKey = (routeName: string): string =>
  routeName === NavigatorName.Earn
    ? `mainNavigation.${getEarnOrYieldSuffix()}`
    : LABELKEY_MAP[routeName] ?? routeName;

export const TRACKING_MENUENTRY_EVENT = "menuentry_clicked";

export const TRACKING_LABEL_MAP: Partial<Record<string, string>> = {
  [NavigatorName.Portfolio]: "Wallet",
  [NavigatorName.Swap]: "Swap",
  [NavigatorName.Earn]: "Earn",
  [NavigatorName.BaanxCardTab]: "Pay",
};
