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
} as const;
