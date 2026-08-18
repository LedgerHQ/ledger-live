import { createApi as createTezosApi } from "@ledgerhq/coin-tezos/api/index";
import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { AccountReadiness } from "@ledgerhq/types-live";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { buildContext } from "../../../bridge/generic-coin-framework/api/context";

export async function getTokenFromAsset(asset: AssetInfo): Promise<TokenCurrency | undefined> {
  if (!("assetReference" in asset) || typeof asset.assetReference !== "string") {
    return undefined;
  }
  const [contractAddress, tokenIdentifier] = asset.assetReference.split(":");
  const store = getCryptoAssetsStore();
  return store.findTokenByAddressInCurrency(contractAddress, "tezos", tokenIdentifier);
}

export function getAssetFromToken(token: TokenCurrency, owner: string): AssetInfo | undefined {
  if (!token.tokenIdentifier) return undefined;
  return {
    type: token.tokenType,
    assetReference: `${token.contractAddress}:${token.tokenIdentifier}`,
    assetOwner: owner,
    name: token.name,
    unit: token.units[0],
  };
}

export function computeIntentType(transaction: Record<string, unknown>): string {
  const { mode } = transaction;
  if (mode == null) return "send";
  if (typeof mode !== "string") throw new Error(`Unsupported transaction mode: ${String(mode)}`);
  switch (mode) {
    case "send":
    case "delegate":
    case "undelegate":
    case "stake":
    case "unstake":
    case "finalize_unstake":
      return mode;
    default:
      throw new Error(`Unsupported transaction mode: ${mode}`);
  }
}

/**
 * Readiness for a Tezos account: not ready (reason "unrevealed") until the account's
 * public key is revealed on-chain.
 */
export async function getAccountReadiness(
  currency: CryptoCurrency,
  address: string,
): Promise<AccountReadiness> {
  const api = createTezosApi();
  const { revealed } = await api.getAccountInfo!(buildContext(currency.id), address);
  return revealed ? { ready: true } : { ready: false, reason: "unrevealed" };
}

export default {
  getTokenFromAsset,
  getAssetFromToken,
  usesStakingPositions: true,
  computeIntentType,
  getAccountReadiness,
} satisfies BridgeApi;
