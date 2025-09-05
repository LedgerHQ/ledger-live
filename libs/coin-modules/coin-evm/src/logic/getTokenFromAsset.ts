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

export function getAssetFromToken(
  currency: CryptoCurrency,
  token: TokenCurrency,
  owner: string,
): AssetInfo {
  if (token.parentCurrency.id !== currency.id) {
    throw new Error(`'${token.id}' is not a valid token for '${currency.id}'`);
  }

  return {
    type: token.tokenType,
    assetReference: token.contractAddress,
    assetOwner: owner,
    name: token.name,
    unit: token.units[0],
  };
}
