import { cosmosDefaults, type CosmosCoinConfig } from "../config";

/** The served default config of `currencyId`, as `getCurrencyConfiguration` resolves it. */
export function cosmosDefaultsFor(currencyId?: string): CosmosCoinConfig {
  const entry = Object.entries(cosmosDefaults).find(([id]) => id === currencyId);
  if (!entry) throw new Error(`No currency configuration available for ${currencyId}`);
  return entry[1];
}
