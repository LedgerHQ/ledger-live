import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { isTokenAsset } from "@ledgerhq/coin-cardano/logic";
import { decodeTokenAssetId, decodeTokenCurrencyId } from "@ledgerhq/coin-cardano/buildSubAccounts";

// A Cardano asset is a token iff it carries an assetReference — keyed by `<policyId><assetName>`, the
// same reference getBalance/listOperations/craftTransaction use. CAL stores the two parts apart:
// contractAddress is the policyId and tokenIdentifier the assetName (absent when empty), so the
// lookup splits the reference and the reverse mapping rebuilds it from the token id. Reuse
// coin-cardano's isTokenAsset so craft/validate/bridge classify identically: `asset.type` is unreliable
// here — CAL types native tokens as tokenType "native" (so intent assets are type "native") while
// getBalance emits them as type "token"; only plain ADA ever lacks an assetReference. The explicit
// assetReference check additionally narrows the type for decodeTokenAssetId.
export async function getTokenFromAsset(
  currency: CryptoCurrency,
  asset: AssetInfo,
): Promise<TokenCurrency | undefined> {
  if (!isTokenAsset(asset) || !("assetReference" in asset) || !asset.assetReference) {
    return undefined;
  }
  const { policyId, assetName } = decodeTokenAssetId(asset.assetReference);
  return getCryptoAssetsStore().findTokenByAddressInCurrency(
    policyId,
    currency.id,
    assetName || undefined,
  );
}

export function getAssetFromToken(token: TokenCurrency, owner: string): AssetInfo {
  return {
    type: token.tokenType,
    assetReference: decodeTokenCurrencyId(token.id).assetId,
    assetOwner: owner,
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
