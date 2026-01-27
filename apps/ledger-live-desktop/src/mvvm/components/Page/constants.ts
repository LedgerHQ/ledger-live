/**
 * Pages that use the Wallet 4.0 experience:
 * - Tailwind background color
 * - RightPanel (swap sidebar)
 * - Wallet40Layout with pt-32 spacing
 */
export const WALLET_40_PAGES = new Set(["/", "/market", "/analytics"]);

/**
 * Check if a pathname is a Wallet 4.0 page
 */
export const isWallet40Page = (pathname: string): boolean => WALLET_40_PAGES.has(pathname);

/**
 * Scroll threshold (in pixels) before showing the scroll-to-top button
 */
export const SCROLL_UP_BUTTON_THRESHOLD = 800;

/**
 * Width of the right panel (swap sidebar) in pixels
 */
export const RIGHT_PANEL_WIDTH = 375;
