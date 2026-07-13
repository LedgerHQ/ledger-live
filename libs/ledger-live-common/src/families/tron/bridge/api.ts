import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

export async function getTokenFromAsset(
  currency: CryptoCurrency,
  asset: AssetInfo,
): Promise<TokenCurrency | undefined> {
  if (asset.type === "native" || !("assetReference" in asset) || !asset.assetReference) {
    return undefined;
  }
  // Tron indexes TRC10 by its numeric asset id and TRC20 by its contract address;
  // in both cases the value is carried in `contractAddress` on the token currency.
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

export function computeIntentType(transaction: Record<string, unknown>): string {
  const mode = transaction.mode as string | undefined;

  switch (mode) {
    case "send":
    case undefined:
      return "send";
    default:
      throw new Error(`Unsupported Tron transaction mode: ${mode}`);
  }
}

export default function tronBridge(currency: CryptoCurrency): BridgeApi {
  return {
    getTokenFromAsset: async (asset: AssetInfo) => getTokenFromAsset(currency, asset),
    getAssetFromToken: (token: TokenCurrency, owner: string) => getAssetFromToken(token, owner),
    computeIntentType: (transaction: Record<string, unknown>) => computeIntentType(transaction),
  };
}
