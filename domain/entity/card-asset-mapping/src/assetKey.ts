/**
 * What a card provider calls an asset, as one id.
 *
 * A provider names an asset with a `currency` and a `network` and neither is a Ledger id, so the
 * pair is what a catalog has to be keyed on: `usdc` alone does not say which chain's USDC it is.
 * Both halves are lowercased, because Baanx has not been consistent about their case.
 */
export type AssetMappingKey = string;

export function assetMappingKey(currency: string, network: string): AssetMappingKey {
  return `${currency.trim().toLowerCase()}.${network.trim().toLowerCase()}`;
}
