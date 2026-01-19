import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";

export async function getTokenFromAsset(
  currencyId: string,
  asset: AssetInfo,
): Promise<TokenCurrency | undefined> {
  const tokenId =
    asset.type !== "native" && "assetReference" in asset ? asset.assetReference : undefined;

  if (!tokenId) {
    return;
  }

  return getCryptoAssetsStore().findTokenByAddressInCurrency(tokenId, currencyId);
}
