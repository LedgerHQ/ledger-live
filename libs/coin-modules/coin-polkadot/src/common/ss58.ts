/**
 * SS58 address prefix by currency ID.
 *
 * Polkadot and its asset-hub parachains use prefix 0.
 * Westend, its asset-hub, and Bittensor use the generic Substrate prefix 42.
 * Unknown currencies fall back to 0 (Polkadot mainnet).
 */
export const SS58_PREFIX_BY_CURRENCY: Record<string, number> = {
  polkadot: 0,
  assethub_polkadot: 0,
  westend: 42,
  assethub_westend: 42,
  bittensor: 42,
};

export const DEFAULT_SS58_PREFIX = 0;

export const getSs58Prefix = (currencyId: string | undefined): number =>
  SS58_PREFIX_BY_CURRENCY[currencyId ?? ""] ?? DEFAULT_SS58_PREFIX;
