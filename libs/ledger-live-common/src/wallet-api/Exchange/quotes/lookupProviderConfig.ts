import type { MergedProviderConfig } from "../../../exchange/providers/swap";

/**
 * Full swap partner catalog from `fetchAndMergeProviderData` (CAL + CDN), keyed by
 * lowercase provider id. Used to enrich each raw quote row with display name, KYC, URLs, etc.
 */
export type ProviderData = Record<string, MergedProviderConfig>;

/**
 * Resolve one partner's config from `providerData` by raw quote `provider` id.
 * Mirrors swap-core changelly / changelly_v2 handling where useful.
 */
export function lookupProvider(
  providerData: ProviderData,
  providerId: string,
): MergedProviderConfig | undefined {
  const id = providerId.toLowerCase();
  if (providerData[id]) return providerData[id];
  if (id === "changelly_v2") return providerData.changelly;
  if (id === "changelly") return providerData.changelly_v2;
  return undefined;
}

export function getProviderDisplayName(
  config: MergedProviderConfig | undefined,
  fallbackProviderId: string,
): string {
  if (!config) return fallbackProviderId;
  if (config.displayName) return config.displayName;
  // `name` only exists on the CEX branch of the discriminated union. CAL data can
  // occasionally surface a raw-hex value there (signature-file format), so skip it.
  if (config.type === "CEX" && config.name && !/^[0-9a-fA-F]+$/.test(config.name)) {
    return config.name;
  }
  return fallbackProviderId;
}
