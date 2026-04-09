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

export default {
  getTokenFromAsset,
} satisfies BridgeApi;
