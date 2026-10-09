import { addPrefixToken, extractTokenId } from "@ledgerhq/coin-algorand/tokens";
import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";

// Algorand assets have no issuer: the owner is the holder's address, the value coin-algorand's
// `getBalance` and `listOperations` emit. An empty owner turns every ASA send into a native one.
export function getAssetFromToken(token: TokenCurrency, owner: string): AssetInfo {
  return {
    type: "asa",
    assetReference: extractTokenId(token.id),
    assetOwner: owner,
    name: token.name,
    unit: token.units[0],
  };
}

export async function getTokenFromAsset(asset: AssetInfo): Promise<TokenCurrency | undefined> {
  if (!("assetReference" in asset) || typeof asset.assetReference !== "string") return undefined;
  return getCryptoAssetsStore().findTokenById(addPrefixToken(asset.assetReference));
}

export default {
  getAssetFromToken,
  getTokenFromAsset,
  // Legacy stores other operation ids (an incoming ASA transfer is FEES there, NONE here), so
  // each bridge flag flip must resync from scratch.
  syncVersion: "1",
} satisfies BridgeApi;
