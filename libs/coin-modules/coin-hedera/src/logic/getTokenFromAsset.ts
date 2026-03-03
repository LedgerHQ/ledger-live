import type { AssetInfo } from "@ledgerhq/coin-framework/api/types";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

export async function getTokenFromAsset(
  currency: CryptoCurrency,
  asset: AssetInfo,
): Promise<TokenCurrency | undefined> {
  const tokenId =
    asset.type !== "native" && "assetReference" in asset ? asset.assetReference : undefined;

  if (!tokenId) {
    return;
  }

  return getCryptoAssetsStore().findTokenByAddressInCurrency(tokenId, currency.id);
}
