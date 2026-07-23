import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import { fetchTronAccount } from "@ledgerhq/coin-tron/network";
import { getTronResources, defaultTronResources } from "@ledgerhq/coin-tron/bridge/utils";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

export async function getTokenFromAsset(
  currency: CryptoCurrency,
  asset: AssetInfo,
): Promise<TokenCurrency | undefined> {
  if (asset.type === "native" || !("assetReference" in asset) || !asset.assetReference) {
    return undefined;
  }
  const store = getCryptoAssetsStore();
  // Mirror the legacy synchronization lookup: TRC10 tokens are keyed by their numeric
  // asset id (`<currency>/trc10/<id>`), TRC20 tokens by their contract address.
  if (asset.type === "trc10") {
    return store.findTokenById(`${currency.id}/trc10/${asset.assetReference}`);
  }
  return store.findTokenByAddressInCurrency(asset.assetReference, currency.id);
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
    case "freeze":
    case "unfreeze":
    case "vote":
    case "claimReward":
    case "withdrawExpireUnfreeze":
    case "unDelegateResource":
    case "legacyUnfreeze":
      return mode;
    default:
      throw new Error(`Unsupported Tron transaction mode: ${mode}`);
  }
}

export default function tronBridge(currency: CryptoCurrency): BridgeApi {
  return {
    getTokenFromAsset: async (asset: AssetInfo) => getTokenFromAsset(currency, asset),
    getAssetFromToken: (token: TokenCurrency, owner: string) => getAssetFromToken(token, owner),
    computeIntentType: (transaction: Record<string, unknown>) => computeIntentType(transaction),
    getChainSpecificRules: {
      // TODO: to be replaced when getAccountInfo is implemented on CoinModuleApi
      getAccountShape: async (address: string) => {
        const accs = await fetchTronAccount(address);
        const tronResources =
          accs.length > 0 ? await getTronResources(accs[0]) : defaultTronResources;
        return { tronResources };
      },
      getTransactionStatus: {},
    },
  };
}
