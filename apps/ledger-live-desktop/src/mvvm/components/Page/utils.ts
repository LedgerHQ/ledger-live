/**
 * Pages that use the Wallet 4.0 experience:
 * - Tailwind background color
 * - RightPanel (swap sidebar)
 * - Wallet40Layout with pt-32 spacing
 */
const WALLET_40_PAGES = new Set(["/", "/market", "/analytics"]);

const WALLET_40_PREFIXES = ["/card", "/swap"];

/**
 * Pages that display the right panel (swap sidebar)
 */
const RIGHT_PANEL_PAGES = new Set(["/", "/analytics"]);

/**
 * Check if a pathname uses the Wallet 4.0 layout
 */
export const isWallet40Page = (pathname: string): boolean =>
  WALLET_40_PAGES.has(pathname) || WALLET_40_PREFIXES.some(prefix => pathname.startsWith(prefix));

/**
 * Check if a pathname should display the right panel (swap sidebar)
 */
export const shouldDisplayRightPanel = (pathname: string): boolean =>
  RIGHT_PANEL_PAGES.has(pathname);
