import { createApi as createTezosApi } from "@ledgerhq/coin-tezos/api/index";
import type { TezosCoinConfig } from "@ledgerhq/coin-tezos/config";
import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { AccountReadiness } from "@ledgerhq/types-live";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { getCurrencyConfiguration } from "../../../config";

export async function getTokenFromAsset(asset: AssetInfo): Promise<TokenCurrency | undefined> {
  if (!("assetReference" in asset) || typeof asset.assetReference !== "string") {
    return undefined;
  }
  const [contractAddress, tokenIdentifier] = asset.assetReference.split(":");
  const store = getCryptoAssetsStore();
  return store.findTokenByAddressInCurrency(contractAddress, "tezos", tokenIdentifier);
}

/**
 * Derives the FA2 tokenId from a TokenCurrency's CAL id.
 * CAL ids follow the pattern `tezos/fa2/{name}_{contract}` (tokenId=0)
 * or `tezos/fa2/{name}_{contract}_{tokenId}` (multi-asset).
 */
function deriveTokenId(token: TokenCurrency): string {
  const contractLower = token.contractAddress.toLowerCase();
  const suffix = token.id.split(contractLower)[1];
  return suffix?.match(/^_(\d+)$/)?.[1] ?? "0";
}

export function getAssetFromToken(token: TokenCurrency, owner: string): AssetInfo {
  const tokenId = deriveTokenId(token);
  return {
    type: token.tokenType,
    assetReference: `${token.contractAddress}:${tokenId}`,
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
  const api = createTezosApi(getCurrencyConfiguration<TezosCoinConfig>(currency.id));
  const { revealed } = await api.getAccountInfo(address);
  return revealed ? { ready: true } : { ready: false, reason: "unrevealed" };
}

export default {
  getTokenFromAsset,
  getAssetFromToken,
  usesStakingPositions: true,
  computeIntentType,
  getAccountReadiness,
} satisfies BridgeApi;
