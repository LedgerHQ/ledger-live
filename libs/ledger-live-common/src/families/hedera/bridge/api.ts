import { HEDERA_TRANSACTION_MODES } from "@ledgerhq/coin-hedera/constants";
import { getAssetFromToken } from "@ledgerhq/coin-hedera/logic/getAssetFromToken";
import { getTokenFromAsset } from "@ledgerhq/coin-hedera/logic/getTokenFromAsset";
import { apiClient } from "@ledgerhq/coin-hedera/network/api";
import type { HederaCoinConfig, HederaTxData } from "@ledgerhq/coin-hedera/types";
import type {
  BridgeApi,
  OptimisticOperationDescriptor,
} from "@ledgerhq/ledger-wallet-framework/api/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { isStakingAccount, type Account } from "@ledgerhq/types-live";
import { getCurrencyConfiguration } from "../../../config";

export async function getAddressesForPublicKey(
  currency: CryptoCurrency,
  publicKey: string,
): Promise<string[]> {
  const config = getCurrencyConfiguration<HederaCoinConfig>(currency.id);
  const accounts = await apiClient.getAccountsForPublicKey({
    configOrCurrencyId: config,
    publicKey,
  });

  return accounts.map(a => a.account);
}

// Every Hedera account sits on the seed path (`44/3030`), so its key is `seedIdentifier`.
export function keyControlsAccount(publicKey: string, account: Account): boolean {
  return publicKey === account.seedIdentifier;
}

export function computeIntentType(transaction: Record<string, unknown>): HEDERA_TRANSACTION_MODES {
  const { mode } = transaction;

  switch (mode) {
    case "send":
    case undefined:
      return HEDERA_TRANSACTION_MODES.Send;
    case "delegate":
      return HEDERA_TRANSACTION_MODES.Delegate;
    case "undelegate":
      return HEDERA_TRANSACTION_MODES.Undelegate;
    case "redelegate":
      return HEDERA_TRANSACTION_MODES.Redelegate;
    case "claimReward":
      return HEDERA_TRANSACTION_MODES.ClaimRewards;
    default:
      throw new Error(`Unsupported Hedera transaction mode: ${String(mode)}`);
  }
}

// `craftTransaction` reads the staked node id from `intent.data` only. Without this hook a staking
// transaction signs and broadcasts while changing nothing.
export function buildIntentData(transaction: Record<string, unknown>): HederaTxData {
  const { mode, valId } = transaction;

  // `null` clears the staked node.
  if (mode === "undelegate") return { type: "staking", stakingNodeId: null };
  if (mode !== "delegate" && mode !== "redelegate") return { type: "none" };

  return { type: "staking", stakingNodeId: valId ? Number(valId) : null };
}

// A claim carries no amount, so the pending row would show 0 until the next sync.
export function describeOptimisticOperation(
  mode: string,
  account: Account,
): OptimisticOperationDescriptor | undefined {
  if (mode !== "claimReward" || !isStakingAccount(account)) return undefined;

  const reward = account.stakingResources?.pendingRewardsBalance;
  return reward ? { value: reward } : undefined;
}

export default function hederaBridge(currency: CryptoCurrency): BridgeApi {
  return {
    addressLookup: {
      getAddresses: derived => getAddressesForPublicKey(currency, derived.publicKey),
      keyControlsAccount,
    },
    getTokenFromAsset: asset => getTokenFromAsset(currency, asset),
    getAssetFromToken,
    computeIntentType,
    buildIntentData,
    describeOptimisticOperation,
    stakingSupported: true,
    shouldMergeOps: false,
  };
}
