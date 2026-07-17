import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";

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

export default {
  getTokenFromAsset,
  getAssetFromToken,
  usesStakingPositions: true,
  computeIntentType,
} satisfies BridgeApi;
