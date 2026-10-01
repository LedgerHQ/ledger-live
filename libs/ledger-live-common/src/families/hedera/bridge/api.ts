import BigNumber from "bignumber.js";
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
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { isStakingAccount, type Account, type Operation } from "@ledgerhq/types-live";
import groupBy from "lodash/groupBy";
import omit from "lodash/omit";
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

  // The Mirror Node reports `-1` once an account is undelegated.
  const delegation =
    typeof accountInfo.stakedNodeId === "number" && accountInfo.stakedNodeId >= 0
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
  const { mode } = transaction;

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
      throw new Error(`Unsupported Hedera transaction mode: ${String(mode)}`);
  }
}

// `craftTransaction` reads the staked node id and the gas limit from `intent.data` only. Without this
// hook a staking transaction signs and broadcasts while changing nothing.
export function buildIntentData(transaction: Record<string, unknown>): HederaTxData {
  const { mode, valId } = transaction;

  // `null` clears the staked node.
  if (mode === "undelegate") return { type: "staking", stakingNodeId: null };

  if (mode === "delegate" || mode === "redelegate") {
    return { type: "staking", stakingNodeId: valId ? Number(valId) : null };
  }

  const feeParameters = transaction.feeParameters as Record<string, unknown> | undefined;
  const gasLimit = feeParameters?.gasLimit;

  if (
    computeIntentType(transaction) === HEDERA_TRANSACTION_MODES.Send &&
    typeof gasLimit === "string"
  ) {
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getOperationExtra(operation: Operation): Record<string, unknown> {
  return isRecord(operation.extra) ? operation.extra : {};
}

function isTokenOperation(operation: Operation): boolean {
  const { assetReference, assetOwner } = getOperationExtra(operation);
  return (
    (typeof assetReference === "string" && assetReference.length > 0) ||
    (typeof assetOwner === "string" && assetOwner.length > 0)
  );
}

function feesOperationForTokenTransfer(
  address: string,
  transactionOperations: Operation[],
): Operation | undefined {
  const tokenOperation = transactionOperations.find(isTokenOperation);
  const nativeOperations = transactionOperations.filter(op => !isTokenOperation(op));
  if (!tokenOperation || nativeOperations.length === 0) return undefined;
  if (nativeOperations.some(op => !op.fee.isZero())) return undefined;

  const tokenExtra = getOperationExtra(tokenOperation);
  if (tokenExtra.feePayer !== address || tokenOperation.fee.isZero()) return undefined;

  const { assetReference } = tokenExtra;
  return {
    ...tokenOperation,
    id: encodeOperationId(tokenOperation.accountId, tokenOperation.hash, "FEES"),
    type: "FEES",
    value: tokenOperation.fee,
    recipients: typeof assetReference === "string" ? [assetReference] : tokenOperation.recipients,
    extra: {
      ...omit(tokenExtra, [
        "assetReference",
        "assetOwner",
        "assetAmount",
        "assetSenders",
        "assetRecipients",
      ]),
      ledgerOpType: "FEES",
    },
  };
}

export function adaptOperations(address: string, operations: Operation[]): Operation[] {
  const operationsByHash = groupBy(operations, op => op.hash);

  return operations.flatMap(op => {
    const transactionOperations = operationsByHash[op.hash];
    if (op !== transactionOperations.at(-1)) return [op];

    const feesOperation = feesOperationForTokenTransfer(address, transactionOperations);
    return feesOperation ? [op, feesOperation] : [op];
  });
}

export default function hederaBridge(currency: CryptoCurrency): BridgeApi {
  return {
    addressLookup: {
      getAddresses: derived => getAddressesForPublicKey(currency, derived.publicKey),
      keyControlsAccount,
    },
    getTokenFromAsset: asset => getTokenFromAsset(currency, asset),
    getAssetFromToken,
    buildAccountShape,
    computeIntentType,
    buildIntentData,
    describeOptimisticOperation,
    adaptOperations,
    stakingSupported: true,
    shouldMergeOps: false,
  };
}
