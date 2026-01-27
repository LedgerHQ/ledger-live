/**
 * Pages that use the Wallet 4.0 experience:
 * - Tailwind background color
 * - RightPanel (swap sidebar)
 * - Wallet40Layout with pt-32 spacing
 */
const WALLET_40_PAGES = new Set(["/", "/market", "/analytics"]);

/**
 * Check if a pathname uses the Wallet 4.0 layout
 */
export const isWallet40Page = (pathname: string): boolean => WALLET_40_PAGES.has(pathname);
