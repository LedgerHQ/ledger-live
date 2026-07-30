import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";

/**
 * VeChain's only in-module token is VTHO (see `@ledgerhq/coin-vechain/logic/account/getBalance`,
 * which reports it as `{ type: "token", assetReference: VTHO_ADDRESS }`), so the address-keyed
 * lookup used by every other VIP180/ERC20-style asset is enough here.
 */
export async function getTokenFromAsset(
  currency: CryptoCurrency,
  asset: AssetInfo,
): Promise<TokenCurrency | undefined> {
  if (asset.type === "native" || !("assetReference" in asset) || !asset.assetReference) {
    return undefined;
  }
  return getCryptoAssetsStore().findTokenByAddressInCurrency(asset.assetReference, currency.id);
}

export function getAssetFromToken(token: TokenCurrency, owner: string): AssetInfo {
  return {
    type: "token",
    assetReference: token.contractAddress,
    assetOwner: owner,
    name: token.name,
    unit: token.units[0],
  };
}

export default function vechainBridge(currency: CryptoCurrency): BridgeApi {
  return {
    getTokenFromAsset: (asset: AssetInfo) => getTokenFromAsset(currency, asset),
    getAssetFromToken: (token: TokenCurrency, owner: string) => getAssetFromToken(token, owner),
  };
}
