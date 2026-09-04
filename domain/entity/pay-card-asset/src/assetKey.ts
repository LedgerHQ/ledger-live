/**
 * What the Card provider calls an asset, as one id.
 *
 * The provider names an asset with a `currency` and a `network` and neither is a Ledger id, so the
 * pair is what a mapping has to be keyed on: `usdc` alone does not say which chain's USDC it is.
 * Both halves are lowercased, because the provider has not been consistent about their case.
 */
export type PayCardAssetKey = string;

export function payCardAssetKey(currency: string, network: string): PayCardAssetKey {
  return `${currency.trim().toLowerCase()}.${network.trim().toLowerCase()}`;
}
