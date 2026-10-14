import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";

// Same mapping as Stellar: issuer = contractAddress / assetOwner, currency code or MPT issuance id =
// tokenIdentifier / assetReference.
export async function getTokenFromAsset(
  currency: CryptoCurrency,
  asset: AssetInfo,
): Promise<TokenCurrency | undefined> {
  if (asset.type === "native" || !("assetReference" in asset) || !("assetOwner" in asset)) {
    return undefined;
  }
  if (!asset.assetReference || !asset.assetOwner) return undefined;
  return getCryptoAssetsStore().findTokenByAddressInCurrency(
    asset.assetOwner,
    currency.id,
    asset.assetReference,
  );
}

export function getAssetFromToken(token: TokenCurrency): AssetInfo | undefined {
  if (!token.tokenIdentifier) return undefined;
  return {
    type: token.tokenType,
    assetReference: token.tokenIdentifier,
    assetOwner: token.contractAddress,
    name: token.name,
    unit: token.units[0],
  };
}

export default function xrpBridgeApi(currency: CryptoCurrency): BridgeApi {
  return {
    getTokenFromAsset: (asset: AssetInfo) => getTokenFromAsset(currency, asset),
    getAssetFromToken,
  };
}
