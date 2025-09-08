import type { AssetInfo } from "@ledgerhq/coin-framework/api/types";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { findTokenByAddressInCurrency } from "@ledgerhq/cryptoassets/tokens";

export function getTokenFromAsset(
  currency: CryptoCurrency,
  asset: AssetInfo,
): TokenCurrency | undefined {
  const tokenId =
    asset.type !== "native" && "assetReference" in asset ? asset.assetReference : undefined;

  if (!tokenId) {
    return;
  }

  return findTokenByAddressInCurrency(tokenId, currency.id);
}
