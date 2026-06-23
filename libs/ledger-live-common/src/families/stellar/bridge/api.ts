import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { BridgeApi, ChainSpecificRules } from "@ledgerhq/ledger-wallet-framework/api/types";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { StellarBurnAddressError } from "@ledgerhq/coin-stellar/types";
import { STELLAR_BURN_ADDRESS } from "@ledgerhq/coin-stellar/logic";

export const getChainSpecificRules: ChainSpecificRules = {
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

export async function getTokenFromAsset(asset: AssetInfo): Promise<TokenCurrency | undefined> {
  const result =
    asset.type !== "native" &&
    "assetOwner" in asset &&
    typeof asset.assetOwner === "string" &&
    "assetReference" in asset &&
    typeof asset.assetReference === "string"
      ? await getCryptoAssetsStore().findTokenByAddressInCurrency(
          asset.assetOwner,
          "stellar",
          asset.assetReference,
        )
      : undefined;
  return result;
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
