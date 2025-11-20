import { AssetInfo } from "@ledgerhq/coin-framework/api/types";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";

export async function getTokenFromAsset(asset: AssetInfo): Promise<TokenCurrency | undefined> {
  const assetId =
    asset.type !== "native" && "assetReference" in asset && "assetOwner" in asset
      ? `${asset.assetReference}:${asset.assetOwner}`
      : "";
  return await getCryptoAssetsStore().findTokenById(`stellar/asset/${assetId}`);
}

export function getAssetFromToken(token: TokenCurrency): AssetInfo {
  return {
    type: token.tokenType,
    assetReference: token.name,
    assetOwner: token.contractAddress,
    name: token.name,
    unit: token.units[0],
  };
}
