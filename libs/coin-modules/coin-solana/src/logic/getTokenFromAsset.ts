import type { AssetInfo } from "@ledgerhq/coin-framework/api/types";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";

/** Resolves a Ledger `TokenCurrency` from an Alpaca `AssetInfo` by looking up
 *  the asset's contract address (mint) in the crypto-assets store. */
export async function getTokenFromAsset(
  currencyId: string,
  asset: AssetInfo,
): Promise<TokenCurrency | undefined> {
  if (asset.type === "native" || !("assetReference" in asset)) {
    return undefined;
  }
  return getCryptoAssetsStore().findTokenByAddressInCurrency(asset.assetReference, currencyId);
}

/**
 * Inverse of `getTokenFromAsset`: builds an Alpaca `AssetInfo` from a
 * Ledger `TokenCurrency`.
 *
 * Used by the generic-alpaca bridge (`prepareTransaction`) to derive
 * `assetReference` / `assetOwner` from a sub-account's token, which is
 * required for `craftTransaction` to build a proper SPL token transfer
 * instead of a native SOL transfer.
 */
export function getAssetFromToken(token: TokenCurrency, owner: string): AssetInfo {
  return {
    type: token.tokenType,
    assetReference: token.contractAddress,
    assetOwner: owner,
    name: token.name,
    unit: token.units[0],
  };
}
