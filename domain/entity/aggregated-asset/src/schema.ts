/**
 * An aggregated asset: one logical asset grouping several per-network currencies.
 *
 * `assetsIds` maps a network id to the currency id that represents this asset on that network,
 * which is what makes it "aggregated" rather than a single currency.
 */
export interface CryptoAssetMeta {
  /** Asset identifier */
  id: string;
  /** Asset ticker symbol */
  ticker: string;
  /** Asset display name */
  name: string;
  /** Map of network IDs to their corresponding asset IDs */
  assetsIds: Record<string, string>;
}
