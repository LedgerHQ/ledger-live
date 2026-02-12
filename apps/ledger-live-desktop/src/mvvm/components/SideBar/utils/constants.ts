/**
 * Mapping from sidebar item value (for Wallet 4.0 SideBar) to route path.
 */
export const SIDEBAR_VALUE_TO_PATH = {
  home: "/",
  accounts: "/accounts",
  swap: "/swap",
  earn: "/earn",
  discover: "/platform",
  card: "/card-new-wallet",
} as const;

export type SideBarNavValue = keyof typeof SIDEBAR_VALUE_TO_PATH;

/**
 * Mapping from sidebar nav value to tracking entry name,
 * aligned with SIDEBAR_NAV_REGISTRY so Wallet 4.0 sidebar emits
 * the same "menuentry_clicked" events as the legacy sidebar.
 */
export const SIDEBAR_VALUE_TO_TRACK_ENTRY: Record<SideBarNavValue, string> = {
  home: "/portfolio",
  accounts: "accounts",
  swap: "swap",
  earn: "earn",
  discover: "platform",
  card: "card",
} as const;

/**
 * Special sidebar values that don't map to a simple path navigation.
 * These trigger custom handlers instead of standard push(path).
 */
export const SIDEBAR_SPECIAL_VALUES = {
  refer: "refer",
  recover: "recover",
} as const;

export type SideBarSpecialValue =
  (typeof SIDEBAR_SPECIAL_VALUES)[keyof typeof SIDEBAR_SPECIAL_VALUES];
