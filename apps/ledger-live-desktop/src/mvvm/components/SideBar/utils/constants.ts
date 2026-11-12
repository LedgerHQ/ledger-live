import {
  AGENT_INTENT_SOURCE,
  AGENT_INTENT_TRACKING_ENTRY,
} from "@features/platform-agent-intent-entry-points";
import { getAgentIntentPath } from "LLD/features/AgentIntent/getAgentIntentPath";

/**
 * Mapping from sidebar item value (for Wallet 4.0 SideBar) to route path.
 */
export const SIDEBAR_VALUE_TO_PATH = {
  home: "/",
  accounts: "/accounts",
  cryptos: "/cryptos",
  swap: "/swap",
  earn: "/earn",
  discover: "/platform",
  card: "/card-new-wallet",
  paytab: "/paytab",
  agents: getAgentIntentPath(AGENT_INTENT_SOURCE.navBar),
} as const;

/** Sidebar "Accounts" entry opens the Cryptos page. */
export const ACCOUNTS_SIDEBAR_PATH = SIDEBAR_VALUE_TO_PATH.cryptos;

export type SideBarNavValue = keyof typeof SIDEBAR_VALUE_TO_PATH;

/**
 * Mapping from sidebar nav value to tracking entry name,
 * aligned with SIDEBAR_NAV_REGISTRY so Wallet 4.0 sidebar emits
 * the same "menuentry_clicked" events as the legacy sidebar.
 */
export const SIDEBAR_VALUE_TO_TRACK_ENTRY: Record<SideBarNavValue, string> = {
  home: "/portfolio",
  accounts: "accounts",
  cryptos: "cryptos",
  swap: "swap",
  earn: "earn",
  discover: "platform",
  card: "card",
  paytab: "paytab",
  agents: AGENT_INTENT_TRACKING_ENTRY,
} as const;

/** Extra `menuentry_clicked` properties of the sidebar items that need them. */
export const SIDEBAR_VALUE_TO_TRACK_EXTRA_PROPS: Partial<
  Record<SideBarNavValue, Readonly<Record<string, string>>>
> = {
  agents: { source: AGENT_INTENT_SOURCE.navBar },
};
