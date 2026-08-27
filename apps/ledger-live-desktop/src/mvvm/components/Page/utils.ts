// =============================================================================
// Wallet 4.0 layout
// =============================================================================

export interface IsWallet40PageOptions {
  readonly shouldDisplayAggregatedAssets?: boolean;
}

interface ConditionalPrefix {
  readonly prefix: string;
  readonly isEnabled: (options: IsWallet40PageOptions) => boolean;
}

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
  "/contacts",
  "/devtools",
  "/paytab",
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
// Fullscreen overlay routes (Recover, Perps webviews)
// =============================================================================

const isRecoverPlayerRoute = (pathname: string): boolean => /^\/recover\/[^/]+$/.test(pathname);

const isPerpsWebviewRoute = (pathname: string): boolean =>
  pathname === "/perps" || pathname.startsWith("/perps/");

/**
 * Routes that render a fullscreen webview overlay and should not show the main app shell.
 */
export const isFullscreenOverlayRoute = (pathname: string): boolean =>
  isRecoverPlayerRoute(pathname) || isPerpsWebviewRoute(pathname);

// =============================================================================
// Right panel (swap sidebar / Pay card)
// =============================================================================

export type RightPanelVariant = "swap" | "card";

interface RightPanelVariantMatcher {
  readonly variant: RightPanelVariant;
  readonly matches: (pathname: string, options: IsWallet40PageOptions) => boolean;
}

/**
 * Pages that display the swap sidebar in the right panel.
 */
const RIGHT_PANEL_PAGES = new Set<string>(["/", "/analytics"]);

/**
 * Pages that display the Pay Card container in the right panel.
 */
const CARD_RIGHT_PANEL_PAGES = new Set<string>(["/paytab"]);

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

const RIGHT_PANEL_VARIANT_MATCHERS: readonly RightPanelVariantMatcher[] = [
  { variant: "card", matches: pathname => CARD_RIGHT_PANEL_PAGES.has(pathname) },
  { variant: "swap", matches: (pathname, options) => shouldDisplayRightPanel(pathname, options) },
];

/**
 * Resolve which right-panel content a route should show.
 * Visibility gating (feature flags, swap availability) is applied by usePageViewModel.
 */
export const getRightPanelVariant = (
  pathname: string,
  options: IsWallet40PageOptions = {},
): RightPanelVariant | undefined =>
  RIGHT_PANEL_VARIANT_MATCHERS.find(matcher => matcher.matches(pathname, options))?.variant;

// =============================================================================
// Page testid
// =============================================================================

// Testid kept verbatim from the pathname so it mirrors the route exactly; `/` falls back to dashboard.
export const getPageTestId = (pathname: string): string =>
  `page-view-${pathname.replace(/^\/+/, "") || "dashboard"}`;
