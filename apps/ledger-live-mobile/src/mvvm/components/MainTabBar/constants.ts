import {
  AGENT_INTENT_SOURCE,
  AGENT_INTENT_TRACKING_ENTRY,
} from "@features/platform-agent-intent-entry-points";
import { NavigatorName } from "~/const";
import { getEarnOrYieldSuffix } from "~/helpers/getStakeLabelLocaleBased";

const LABELKEY_MAP: Partial<Record<string, string>> = {
  [NavigatorName.Portfolio]: "mainNavigation.home",
  [NavigatorName.Swap]: "mainNavigation.swap",
  [NavigatorName.CardTab]: "mainNavigation.card",
  [NavigatorName.PayTab]: "mainNavigation.paytab",
  [NavigatorName.AgentIntentTab]: "mainNavigation.agents",
};

export const getLabelKey = (routeName: string): string =>
  routeName === NavigatorName.Earn
    ? `mainNavigation.${getEarnOrYieldSuffix()}`
    : (LABELKEY_MAP[routeName] ?? routeName);

export const TRACKING_MENUENTRY_EVENT = "menuentry_clicked";

export const TRACKING_LABEL_MAP: Partial<Record<string, string>> = {
  [NavigatorName.Portfolio]: "Wallet",
  [NavigatorName.Swap]: "Swap",
  [NavigatorName.Earn]: "Earn",
  [NavigatorName.CardTab]: "Card",
  [NavigatorName.PayTab]: "PayTab",
  [NavigatorName.AgentIntentTab]: AGENT_INTENT_TRACKING_ENTRY,
};

export const TRACKING_EXTRA_PROPS_MAP: Partial<Record<string, Record<string, string>>> = {
  [NavigatorName.AgentIntentTab]: { source: AGENT_INTENT_SOURCE.navBar },
};
