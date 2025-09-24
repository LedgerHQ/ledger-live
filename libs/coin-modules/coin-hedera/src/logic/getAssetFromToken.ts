import type { AssetInfo } from "@ledgerhq/coin-framework/api/types";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";

export function getAssetFromToken(token: TokenCurrency, owner: string): AssetInfo {
  return {
    type: token.tokenType,
    assetReference: token.contractAddress,
    assetOwner: owner,
    name: token.name,
    unit: token.units[0],
  };
}
