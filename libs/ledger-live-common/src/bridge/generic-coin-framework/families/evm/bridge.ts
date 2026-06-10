import type { AssetInfo, BalanceOptions } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type {
  Operation as LiveOperation,
  StakingRedelegation,
  StakingResources,
} from "@ledgerhq/types-live";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import eip55 from "eip55";
import {
  fetchRedelegations,
  buildRedelegationsFromOps,
} from "@ledgerhq/coin-evm/staking/redelegations";

export async function getTokenFromAsset(
  currency: CryptoCurrency,
  asset: AssetInfo,
): Promise<TokenCurrency | undefined> {
  const result =
    "assetReference" in asset && typeof asset.assetReference === "string"
      ? await getCryptoAssetsStore().findTokenByAddressInCurrency(asset.assetReference, currency.id)
      : undefined;
  return result;
}

export function getAssetFromToken(
  currency: CryptoCurrency,
  token: TokenCurrency,
  owner: string,
): AssetInfo {
  if (token.parentCurrency.id !== currency.id) {
    throw new Error(`'${token.id}' is not a valid token for '${currency.id}'`);
  }

  return {
    type: token.tokenType,
    assetReference: eip55.encode(token.contractAddress),
    assetOwner: owner,
    name: token.name,
    unit: token.units[0],
  };
}

export function computeIntentType(transaction: Record<string, unknown>): string {
  if (typeof transaction.mode !== "string") {
    throw new Error(`Unsupported transaction mode: ${transaction.mode}`);
  }

  if (["send-legacy", "send-eip1559"].includes(transaction.mode)) {
    return transaction.mode;
  }

  if (
    ["delegate", "redelegate", "undelegate", "claimReward", "compoundReward"].includes(
      transaction.mode,
    )
  ) {
    return transaction.type === 2 ? "staking-eip1559" : "staking-legacy";
  }

  if (transaction.mode === "send") {
    return transaction.type === 2 ? "send-eip1559" : "send-legacy";
  }

  throw new Error(`Unsupported transaction mode: '${transaction.mode}'`);
}

function getBalanceOptions(currency: CryptoCurrency): BalanceOptions {
  return {
    includeAssets: async (assetInfo: AssetInfo) => {
      if (assetInfo.type === "native") {
        return true;
      }

      const tokenCurrency = await getTokenFromAsset(currency, assetInfo);
      return tokenCurrency !== undefined;
    },
  };
}

async function enrichStakingResources(
  currency: CryptoCurrency,
  address: string,
  operations: LiveOperation[],
  stakingResources: StakingResources,
): Promise<StakingResources> {
  // Fetch redelegations from the Cosmos REST API (may return empty for
  // EVM-precompile-originated redelegations on chains like Sei).
  const apiRedelegations = await fetchRedelegations(currency.id, address).catch(() => []);

  // Reconstruct active redelegations from the REDELEGATE operation history by
  // decoding the ABI-encoded calldata fetched directly from the RPC node.
  const opsRedelegations = await buildRedelegationsFromOps(currency, operations);

  // Merge both sources, deduplicating by (src, dst) validator pair.
  const key = (r: StakingRedelegation) => `${r.validatorSrcAddress}|${r.validatorDstAddress}`;
  const existing = new Set(apiRedelegations.map(key));
  const merged: StakingRedelegation[] = [
    ...apiRedelegations,
    ...opsRedelegations.filter(r => !existing.has(key(r))),
  ];

  return { ...stakingResources, redelegations: merged };
}

export default function evmBridge(currency: CryptoCurrency): BridgeApi {
  return {
    getTokenFromAsset: async (asset: AssetInfo) => getTokenFromAsset(currency, asset),
    getAssetFromToken: (token: TokenCurrency, owner: string) =>
      getAssetFromToken(currency, token, owner),
    computeIntentType: (transaction: Record<string, unknown>) => computeIntentType(transaction),
    balanceOptions: getBalanceOptions(currency),
    enrichStakingResources: (c, addr, ops, sr) => enrichStakingResources(c, addr, ops, sr),
  };
}
