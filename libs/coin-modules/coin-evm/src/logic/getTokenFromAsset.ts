import { AssetInfo } from "@ledgerhq/coin-framework/api/types";
import { getCryptoAssetsStore } from "@ledgerhq/coin-framework/crypto-assets/index";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

export async function getTokenFromAsset(
  currency: CryptoCurrency,
  asset: AssetInfo,
): Promise<TokenCurrency | undefined> {
  return "assetReference" in asset
    ? await getCryptoAssetsStore().findTokenByAddressInCurrency(asset.assetReference, currency.id)
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
