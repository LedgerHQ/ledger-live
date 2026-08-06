import { z } from "zod";

/**
 * An aggregated asset: one logical asset grouping several per-network currencies.
 *
 * `assetsIds` maps a network id to the currency id that represents this asset on that network,
 * which is what makes it "aggregated" rather than a single currency.
 */
export const CryptoAssetMetaSchema = z.object({
  /** Asset identifier */
  id: z.string(),
  /** Asset ticker symbol */
  ticker: z.string(),
  /** Asset display name */
  name: z.string(),
  /** Map of network IDs to their corresponding asset IDs */
  assetsIds: z.record(z.string(), z.string()),
});
