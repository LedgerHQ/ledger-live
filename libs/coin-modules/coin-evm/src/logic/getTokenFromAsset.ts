import { AssetInfo } from "@ledgerhq/coin-framework/api/types";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import eip55 from "eip55";

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
    assetReference: eip55.encode(token.contractAddress),
    assetOwner: owner,
    name: token.name,
    unit: token.units[0],
  };
}
