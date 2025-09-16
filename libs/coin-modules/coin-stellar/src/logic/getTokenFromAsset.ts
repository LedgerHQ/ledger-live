import { AssetInfo } from "@ledgerhq/coin-framework/api/types";
import { findTokenById } from "@ledgerhq/cryptoassets/tokens";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";

export function getTokenFromAsset(asset: AssetInfo): TokenCurrency | undefined {
  const assetId =
    asset.type !== "native" && "assetReference" in asset && "assetOwner" in asset
      ? `${asset.assetReference}:${asset.assetOwner}`
      : "";
  return findTokenById(`stellar/asset/${assetId}`);
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
