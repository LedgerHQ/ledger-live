import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { BridgeApi, ChainSpecificRules } from "@ledgerhq/ledger-wallet-framework/api/types";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { StellarBurnAddressError } from "@ledgerhq/coin-stellar/types";
import { STELLAR_BURN_ADDRESS } from "@ledgerhq/coin-stellar/logic";

export function getChainSpecificRules(): ChainSpecificRules {
  return {
    getAccountShape: (address: string) => {
      // NOTE: https://github.com/LedgerHQ/ledger-live/pull/2058
      if (address === STELLAR_BURN_ADDRESS) {
        throw new StellarBurnAddressError();
      }
    },
    getTransactionStatus: {
      throwIfPendingOperation: true,
    },
  };
}

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

export default {
  getTokenFromAsset,
  getAssetFromToken,
  getChainSpecificRules,
} satisfies BridgeApi;
