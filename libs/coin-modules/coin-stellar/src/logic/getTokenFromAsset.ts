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
