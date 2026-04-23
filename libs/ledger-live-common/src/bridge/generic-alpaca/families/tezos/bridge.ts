import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";

export async function getTokenFromAsset(asset: AssetInfo): Promise<TokenCurrency | undefined> {
  return "assetReference" in asset
    ? await getCryptoAssetsStore().findTokenByAddressInCurrency(
        asset.assetReference as string,
        "tezos",
      )
    : undefined;
}

export function getAssetFromToken(token: TokenCurrency, owner: string): AssetInfo {
  return {
    type: token.tokenType,
    assetReference: token.contractAddress,
    assetOwner: owner,
    name: token.name,
    unit: token.units[0],
  };
}

export default {
  getTokenFromAsset,
  getAssetFromToken,
} satisfies BridgeApi;
