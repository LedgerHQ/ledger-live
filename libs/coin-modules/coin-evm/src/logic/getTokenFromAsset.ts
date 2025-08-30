import { AssetInfo } from "@ledgerhq/coin-framework/api/types";
import { findTokenByAddressInCurrency } from "@ledgerhq/cryptoassets/tokens";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

export function getTokenFromAsset(
  currency: CryptoCurrency,
  asset: AssetInfo,
): TokenCurrency | undefined {
  return "assetReference" in asset
    ? findTokenByAddressInCurrency(asset.assetReference, currency.id)
    : undefined;
}
