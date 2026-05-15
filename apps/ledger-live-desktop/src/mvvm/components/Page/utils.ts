// =============================================================================
// Types
// =============================================================================

export interface IsWallet40PageOptions {
  readonly shouldDisplayAggregatedAssets?: boolean;
}

interface ConditionalPrefix {
  readonly prefix: string;
  readonly isEnabled: (options: IsWallet40PageOptions) => boolean;
}

// =============================================================================
// Wallet 4.0 layout
// =============================================================================

/**
 * Pages that use the Wallet 4.0 experience:
 * - Tailwind background color
 * - RightPanel (swap sidebar)
 * - Wallet40Layout with pt-32 spacing
 */
const WALLET_40_PAGES = new Set<string>([
  "/",
  "/market",
  "/analytics",
  "/cryptos",
  "/assets",
  "/earn",
  "/perps",
  "/borrow",
  "/history",
]);

/**
 * Path prefixes that always belong to Wallet 4.0 (e.g. `/swap/foo`).
 */
const WALLET_40_PREFIXES: readonly string[] = ["/card", "/swap", "/exchange"];

/**
 * Path prefixes that belong to Wallet 4.0 only when their associated
 * feature flag is enabled.
 */
const CONDITIONAL_WALLET_40_PREFIXES: readonly ConditionalPrefix[] = [
  {
    prefix: "/asset",
    isEnabled: ({ shouldDisplayAggregatedAssets }) => !!shouldDisplayAggregatedAssets,
  },
];

/**
 * Check if a pathname uses the Wallet 4.0 layout.
 */
export const isWallet40Page = (pathname: string, options: IsWallet40PageOptions = {}): boolean => {
  if (WALLET_40_PAGES.has(pathname)) return true;
  if (WALLET_40_PREFIXES.some(prefix => pathname.startsWith(prefix))) return true;
  return CONDITIONAL_WALLET_40_PREFIXES.some(
    ({ prefix, isEnabled }) => isEnabled(options) && pathname.startsWith(prefix),
  );
};

// =============================================================================
// Right panel (swap sidebar)
// =============================================================================

/**
 * Pages that display the right panel (swap sidebar).
 */
const RIGHT_PANEL_PAGES = new Set<string>(["/", "/analytics"]);

const isAggregatedAssetDetailPath = (pathname: string): boolean =>
  pathname === "/asset" || pathname.startsWith("/asset/");

/**
 * Check if a pathname should display the right panel (swap sidebar).
 */
export const shouldDisplayRightPanel = (
  pathname: string,
  options: IsWallet40PageOptions = {},
): boolean => {
  if (RIGHT_PANEL_PAGES.has(pathname)) return true;
  if (isAggregatedAssetDetailPath(pathname)) {
    return !!options.shouldDisplayAggregatedAssets;
  }
  return false;
};
