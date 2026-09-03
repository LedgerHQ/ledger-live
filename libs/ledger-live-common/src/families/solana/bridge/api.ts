import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type {
  BridgeApi,
  OptimisticOperationDescriptor,
} from "@ledgerhq/ledger-wallet-framework/api/types";
import type { Account, OperationType } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
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

export function computeIntentType(transaction: Record<string, unknown>): string {
  const mode = transaction.mode as string | undefined;

  switch (mode) {
    case "send":
    case undefined:
      return "send";
    case "stake":
      return "stake.createAccount";
    case "delegate":
      return "stake.delegate";
    case "undelegate":
      return "stake.undelegate";
    case "unstake":
      return "stake.withdraw";
    default:
      throw new Error(`Unsupported Solana transaction mode: ${mode}`);
  }
}

/**
 * Solana's staking modes do not map onto the framework's default operation types, and the pending
 * row must read the same as the row the next sync produces (`coin-solana/logic/listOperations.ts`):
 * creating a stake account is three instructions that resolve to `DELEGATE`, and a withdrawal
 * resolves to `WITHDRAW_UNBONDED`, not `UNSTAKE`.
 *
 * All four record the fee as their value: none of them sends funds anywhere, they move the
 * account's own lamports in or out of a stake account.
 */
const STAKING_OPERATION_TYPES: Record<string, OperationType> = {
  stake: "DELEGATE",
  delegate: "DELEGATE",
  undelegate: "UNDELEGATE",
  unstake: "WITHDRAW_UNBONDED",
};

export function describeOptimisticOperation(
  mode: string,
  _account: Account,
  transaction: Record<string, unknown>,
): OptimisticOperationDescriptor | undefined {
  const type = STAKING_OPERATION_TYPES[mode];
  if (!type) return undefined;
  const fees = transaction.fees as BigNumber | null | undefined;
  return { type, value: fees ?? new BigNumber(0) };
}

export default function solanaBridge(currency: CryptoCurrency): BridgeApi {
  return {
    // Solana surfaces its stake accounts through `getBalance`, so the framework builds
    // `stakingResources` itself. Declared rather than left to the framework's fallback
    // (`delegationsCount > 0 || unbondingsCount > 0`), which is false for an account that has
    // never staked — `stakingResources` would then be left undefined, and opening the delegation
    // flow throws on `assertStakingResources`. The legacy bridge always set an empty object.
    stakingSupported: true,
    getTokenFromAsset: async (asset: AssetInfo) => getTokenFromAsset(currency, asset),
    getAssetFromToken: (token: TokenCurrency, owner: string) => getAssetFromToken(token, owner),
    computeIntentType: (transaction: Record<string, unknown>) => computeIntentType(transaction),
    describeOptimisticOperation,
  };
}
