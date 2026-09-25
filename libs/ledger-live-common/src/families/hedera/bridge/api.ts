import { HEDERA_TRANSACTION_MODES } from "@ledgerhq/coin-hedera/constants";
import type { HederaAccountInfo } from "@ledgerhq/coin-hedera/logic/getAccountInfo";
import { getAssetFromToken } from "@ledgerhq/coin-hedera/logic/getAssetFromToken";
import { getTokenFromAsset } from "@ledgerhq/coin-hedera/logic/getTokenFromAsset";
import { apiClient } from "@ledgerhq/coin-hedera/network/api";
import type { HederaCoinConfig, HederaResources, HederaTxData } from "@ledgerhq/coin-hedera/types";
import type { AccountInfo } from "@ledgerhq/coin-module-framework/api/types";
import type {
  BridgeApi,
  FamilyAccountShape,
  OptimisticOperationDescriptor,
} from "@ledgerhq/ledger-wallet-framework/api/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { isStakingAccount, type Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getCurrencyConfiguration } from "../../../config";

async function addressesByPublicKey(
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
function keyControlsAccount(publicKey: string, account: Account): boolean {
  return publicKey === account.seedIdentifier;
}

function isHederaAccountInfo(
  accountInfo: AccountInfo | undefined,
): accountInfo is HederaAccountInfo {
  return accountInfo?.type === "hedera";
}

export function buildAccountShape(
  _address: string,
  accountInfo?: AccountInfo,
): FamilyAccountShape | undefined {
  if (!isHederaAccountInfo(accountInfo)) return undefined;

  const delegation =
    typeof accountInfo.stakedNodeId === "number"
      ? {
          nodeId: accountInfo.stakedNodeId,
          // Hedera stakes the whole balance to the node: there is no separate staked amount.
          delegated: new BigNumber(accountInfo.balance),
          pendingReward: new BigNumber(accountInfo.pendingReward),
        }
      : null;

  const hederaResources: HederaResources = {
    maxAutomaticTokenAssociations: accountInfo.maxAutomaticTokenAssociations,
    isAutoTokenAssociationEnabled: accountInfo.maxAutomaticTokenAssociations === -1,
    delegation,
  };

  return { hederaResources };
}

export function computeIntentType(transaction: Record<string, unknown>): HEDERA_TRANSACTION_MODES {
  const mode = transaction.mode as string | undefined;

  switch (mode) {
    case "send":
    case undefined:
      return HEDERA_TRANSACTION_MODES.Send;
    case "tokenAssociate":
      return HEDERA_TRANSACTION_MODES.TokenAssociate;
    case "delegate":
      return HEDERA_TRANSACTION_MODES.Delegate;
    case "undelegate":
      return HEDERA_TRANSACTION_MODES.Undelegate;
    case "redelegate":
      return HEDERA_TRANSACTION_MODES.Redelegate;
    case "claimReward":
      return HEDERA_TRANSACTION_MODES.ClaimRewards;
    default:
      throw new Error(`Unsupported Hedera transaction mode: ${mode}`);
  }
}

// `craftTransaction` reads the staked node id and the gas limit from `intent.data` only. Without this
// hook a staking transaction signs and broadcasts while changing nothing.
export function buildIntentData(transaction: Record<string, unknown>): HederaTxData {
  const mode = transaction.mode as string | undefined;
  // `null` clears the staked node.
  if (mode === "undelegate") return { type: "staking", stakingNodeId: null };

  if (mode === "delegate" || mode === "redelegate") {
    const valId = transaction.valId as string | undefined;
    return { type: "staking", stakingNodeId: valId ? Number(valId) : null };
  }

  const feeParameters = transaction.feeParameters as Record<string, unknown> | undefined;
  const gasLimit = feeParameters?.gasLimit;
  if (mode === "send" && typeof gasLimit === "string") {
    return { type: "erc20", gasLimit: BigInt(gasLimit) };
  }

  return { type: "none" };
}

// A claim carries no amount, so the pending row would show 0 until the next sync.
// An association keeps its 0 amount even though the sync records the fee as its value: pending
// rows lock `fee + value`, so a fee-valued row would lock the fee twice until that sync.
export function describeOptimisticOperation(
  mode: string,
  account: Account,
  transaction: Record<string, unknown>,
): OptimisticOperationDescriptor | undefined {
  if (mode === "tokenAssociate") {
    return { extra: { associatedTokenId: transaction.assetReference } };
  }

  if (mode !== "claimReward" || !isStakingAccount(account)) return undefined;

  const reward = account.stakingResources?.pendingRewardsBalance;
  return reward ? { value: reward } : undefined;
}

export default function hederaBridge(currency: CryptoCurrency): BridgeApi {
  return {
    addressLookup: {
      getAddresses: derived => addressesByPublicKey(currency, derived.publicKey),
      keyControlsAccount,
    },
    getTokenFromAsset: asset => getTokenFromAsset(currency, asset),
    getAssetFromToken,
    buildAccountShape,
    computeIntentType,
    buildIntentData,
    describeOptimisticOperation,
    stakingSupported: true,
    shouldMergeOps: false,
  };
}
