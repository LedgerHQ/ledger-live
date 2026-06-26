import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

/**
 * Resolve a TokenCurrency from an ESDT asset. `assetReference` is the ESDT token
 * identifier (e.g. "USDC-c76f1f"), which is what the crypto-assets store keys on
 * for MultiversX.
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

/**
 * Build an ESDT AssetInfo from a TokenCurrency. For MultiversX, `assetReference`
 * is the token identifier — the coin module's `createApi` crafts ESDTTransfer
 * payloads from it directly.
 */
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
    // Staking modes map to themselves: the coin module's isSupportedStakingType /
    // mapStakingTypeToMode key on these exact strings, and its isStakingIntent
    // classifies them as staking even for the modes the generic framework's
    // isDelegationMode doesn't recognize (unDelegate/claimRewards/reDelegateRewards).
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
    getTokenFromAsset: async (asset: AssetInfo) => getTokenFromAsset(currency, asset),
    getAssetFromToken: (token: TokenCurrency, owner: string) => getAssetFromToken(token, owner),
    computeIntentType: (transaction: Record<string, unknown>) => computeIntentType(transaction),
  };
}
