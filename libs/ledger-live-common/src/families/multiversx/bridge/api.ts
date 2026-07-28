import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";

export async function getTokenFromAsset(
  currency: CryptoCurrency,
  asset: AssetInfo,
): Promise<TokenCurrency | undefined> {
  const result =
    "assetReference" in asset &&
    typeof asset.assetReference === "string" &&
    "assetOwner" in asset &&
    typeof asset.assetOwner === "string"
      ? getCryptoAssetsStore().findTokenByAddressInCurrency(
          asset.assetOwner,
          currency.id,
          asset.assetReference,
        )
      : undefined;
  return result;
}

export function getAssetFromToken(token: TokenCurrency): AssetInfo {
  return {
    type: token.tokenType,
    // TODO: replace with token.tokenIdentifier when available on TokenCurrency
    assetReference: token.contractAddress,
    assetOwner: token.contractAddress,
    name: token.name,
    unit: token.units[0],
  };
}

export function computeIntentType(transaction: Record<string, unknown>): string {
  const mode = transaction.mode;

  switch (mode) {
    case "send":
    case undefined:
      return "send";
    case "delegate":
    case "unDelegate":
    case "claimRewards":
    case "withdraw":
    case "reDelegateRewards":
      return mode;
    default:
      throw new Error(`Unsupported MultiversX transaction mode: ${mode}`);
  }
}

export default function multiversxBridge(currency: CryptoCurrency): BridgeApi {
  return {
    getTokenFromAsset: (asset: AssetInfo) => getTokenFromAsset(currency, asset),
    getAssetFromToken,
    computeIntentType: (transaction: Record<string, unknown>) => computeIntentType(transaction),
  };
}
