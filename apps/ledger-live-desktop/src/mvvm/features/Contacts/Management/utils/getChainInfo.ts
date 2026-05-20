/**
 * Per-chain display info for the Contacts management page.
 *
 * Used by:
 * - The address row's Tag (the human-readable network label).
 * - The address row's leading Spot + `@ledgerhq/crypto-icons` `CryptoIcon`
 *   (the native-token icon for the chain — the page surfaces EVM contacts
 *   today, so showing the chain's gas token reads better than a generic
 *   placeholder).
 * - The details pane's per-chain section header.
 *
 * EVM-only at the current DMK snapshot. When a non-EVM chain lands, or
 * when a shared chain registry surfaces in `@ledgerhq/coin-evm` /
 * `coin-framework`, swap to that. Kept narrowly scoped so the swap is
 * a one-import diff.
 */

export type ChainInfo = {
  /** Long form, shown in the Tag — e.g. "Ethereum network". */
  label: string;
  /** Short form, shown as a section header — e.g. "Ethereum". */
  shortLabel: string;
  /** `CryptoIcon` ticker — the chain's native gas token. */
  ticker: string;
  /** `CryptoIcon` ledgerId — matches the live-common currency id where possible. */
  ledgerId: string;
};

const KNOWN_CHAINS: Record<number, ChainInfo> = {
  1: { label: "Ethereum network", shortLabel: "Ethereum", ticker: "eth", ledgerId: "ethereum" },
  10: { label: "Optimism network", shortLabel: "Optimism", ticker: "eth", ledgerId: "optimism" },
  56: { label: "BNB Chain network", shortLabel: "BNB Chain", ticker: "bnb", ledgerId: "bsc" },
  137: { label: "Polygon network", shortLabel: "Polygon", ticker: "pol", ledgerId: "polygon" },
  8453: { label: "Base network", shortLabel: "Base", ticker: "eth", ledgerId: "base" },
  42161: { label: "Arbitrum network", shortLabel: "Arbitrum", ticker: "eth", ledgerId: "arbitrum" },
  43114: { label: "Avalanche network", shortLabel: "Avalanche", ticker: "avax", ledgerId: "avalanche_c_chain" },
};

const FALLBACK = (chainId: number): ChainInfo => ({
  label: `Chain ${chainId}`,
  shortLabel: `Chain ${chainId}`,
  ticker: "eth",
  ledgerId: "ethereum",
});

export function getChainInfo(chainId: number): ChainInfo {
  return KNOWN_CHAINS[chainId] ?? FALLBACK(chainId);
}
