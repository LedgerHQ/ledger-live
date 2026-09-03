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
  /**
   * Network id to the currency id representing this asset there.
   *
   * Ids stay unbranded for now: branding the values costs 23 fixture sites across three packages
   * and 31 more in the apps, for no production change, since every caller only reads them and a
   * branded string is already assignable to string. Worth doing on its own, not inside another task.
   */
  assetsIds: z.record(z.string(), z.string()),
});
