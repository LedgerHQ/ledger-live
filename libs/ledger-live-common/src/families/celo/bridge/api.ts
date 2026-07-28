import type { CeloStakingType } from "@ledgerhq/coin-celo/api/index";
import type { AssetInfo, BalanceOptions } from "@ledgerhq/coin-module-framework/api/types";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";

export async function getTokenFromAsset(
  currency: CryptoCurrency,
  asset: AssetInfo,
): Promise<TokenCurrency | undefined> {
  if (asset.type === "native" || !("assetReference" in asset) || !asset.assetReference) {
    return undefined;
  }
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

/**
 * Maps a Celo family `Transaction.mode` to the coin-celo api's `celo.*` staking
 * operation (carried on `intent.type`). Celo's operations don't map to the
 * canonical `StakingOperation` enum, so the api uses free-form `celo.*` types
 * (see coin-celo `src/api/stakingIntent.ts`); `revoke` splits into pending/active
 * by `transaction.index` (0 = pending), matching the legacy `buildRevokeTx`.
 */
export function computeIntentType(transaction: Record<string, unknown>): CeloStakingType | "send" {
  const mode = transaction.mode as string | undefined;

  switch (mode) {
    case "send":
    case undefined:
      return "send";
    case "register":
      return "celo.register";
    case "lock":
      return "celo.lock";
    case "unlock":
      return "celo.unlock";
    case "withdraw":
      return "celo.withdraw";
    case "vote":
      return "celo.vote";
    case "activate":
      return "celo.activate";
    case "revoke":
      return (transaction.index as number | null | undefined) === 0
        ? "celo.revokePending"
        : "celo.revokeActive";
    default:
      throw new Error(`Unsupported Celo transaction mode: ${mode}`);
  }
}

/**
 * Restricts the delegated coin-evm `getBalance` to the native asset + tokens the
 * cryptoassets store recognizes, so unknown/spam token contracts seen in recent
 * operations don't bloat the account shape or add RPC load (mirrors the EVM family).
 */
function getBalanceOptions(currency: CryptoCurrency): BalanceOptions {
  return {
    includeAssets: async (asset: AssetInfo) => {
      if (asset.type === "native") return true;
      return (await getTokenFromAsset(currency, asset)) !== undefined;
    },
  };
}

export default function celoBridge(currency: CryptoCurrency): BridgeApi {
  return {
    getTokenFromAsset: async (asset: AssetInfo) => getTokenFromAsset(currency, asset),
    getAssetFromToken: (token: TokenCurrency, owner: string) => getAssetFromToken(token, owner),
    computeIntentType: (transaction: Record<string, unknown>) => computeIntentType(transaction),
    balanceOptions: getBalanceOptions(currency),
    // Celo votes + pending withdrawals are surfaced per-position (via Balance.stake),
    // not as the EVM-style aggregate; see coin-celo src/api/getBalance.ts.
    usesStakingPositions: true,
  };
}
