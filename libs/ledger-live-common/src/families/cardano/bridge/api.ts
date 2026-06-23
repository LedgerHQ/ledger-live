import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { isTokenAsset } from "@ledgerhq/coin-cardano/logic";

// A Cardano asset is a token iff it carries an assetReference — keyed by `<policyId><assetName>`, the
// same reference getBalance/listOperations/craftTransaction use (stored on contractAddress). Reuse
// coin-cardano's isTokenAsset so craft/validate/bridge classify identically: `asset.type` is unreliable
// here — CAL types native tokens as tokenType "native" (so intent assets are type "native") while
// getBalance emits them as type "token"; only plain ADA ever lacks an assetReference. The explicit
// assetReference check additionally narrows the type for findTokenByAddressInCurrency.
export async function getTokenFromAsset(
  currency: CryptoCurrency,
  asset: AssetInfo,
): Promise<TokenCurrency | undefined> {
  if (!isTokenAsset(asset) || !("assetReference" in asset) || !asset.assetReference) {
    return undefined;
  }
  return getCryptoAssetsStore().findTokenByAddressInCurrency(asset.assetReference, currency.id);
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

// No computeIntentType: staking modes (delegate/undelegate) flow correctly through the
// framework default (which preserves transaction.mode + valAddress on the intent), so a custom
// mapping would only risk diverging from that proven path.
export default function cardanoBridge(currency: CryptoCurrency): BridgeApi {
  return {
    getTokenFromAsset: async (asset: AssetInfo) => getTokenFromAsset(currency, asset),
    getAssetFromToken: (token: TokenCurrency, owner: string) => getAssetFromToken(token, owner),
  };
}
