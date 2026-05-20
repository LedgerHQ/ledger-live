/**
 * Map an EVM `chainId` to a short human label rendered in the address-row
 * Tag.
 *
 * Contacts are EVM-only at the current DMK snapshot. When a non-EVM chain
 * lands (or when a central chain registry becomes available), swap this
 * out for the shared lookup. Kept narrowly scoped for now so the swap is
 * a one-import diff.
 */
const KNOWN_CHAINS: Record<number, string> = {
  1: "Ethereum",
  10: "Optimism",
  56: "BNB Chain",
  137: "Polygon",
  8453: "Base",
  42161: "Arbitrum",
  43114: "Avalanche",
};

export function getChainLabel(chainId: number): string {
  return KNOWN_CHAINS[chainId] ?? `Chain ${chainId}`;
}
