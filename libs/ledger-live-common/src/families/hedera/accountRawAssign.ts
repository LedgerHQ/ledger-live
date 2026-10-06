import {
  assignFromAccountRaw as hederaAssignFromAccountRaw,
  assignToAccountRaw as hederaAssignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
} from "@ledgerhq/coin-hedera/bridge/serialization";
import type { Account, AccountRaw } from "@ledgerhq/types-live";
import genericAccountRawAssign from "../../bridge/generic-coin-framework/accountRawAssign";

/**
 * Hedera-specific hooks that persist `hederaResources` (token association settings, delegation)
 * through the `fromAccountRaw` / `toAccountRaw` cycle — the generic coin framework pipeline is
 * family-agnostic and does not serialize it. They replace the generic hooks, so those still run
 * here to keep `stakingResources`. Loading also rewrites swap ids saved by the legacy bridge.
 */
function assignToAccountRaw(account: Account, accountRaw: AccountRaw): void {
  genericAccountRawAssign.assignToAccountRaw(account, accountRaw);
  hederaAssignToAccountRaw(account, accountRaw);
}

// Swap history finds a swap's operation by the tx hash inside `operationId`. Swaps saved by the
// legacy bridge hold URL-safe base64 hashes, the generic bridge's operations standard base64 ones.
// Only the hash segment is converted: a URL-safe hash contains `-`, the segment separator.
function toStandardSwapOperationIds(account: Account): void {
  const prefix = `${account.id}-`;

  for (const swap of account.swapHistory ?? []) {
    const { operationId } = swap;
    const typeStart = operationId.lastIndexOf("-");
    if (!operationId.startsWith(prefix) || typeStart <= prefix.length) continue;

    const hash = operationId.slice(prefix.length, typeStart);
    const standardHash = hash.replace(/-/g, "+").replace(/_/g, "/");
    swap.operationId = `${prefix}${standardHash}${operationId.slice(typeStart)}`;
  }
}

function assignFromAccountRaw(accountRaw: AccountRaw, account: Account): void {
  genericAccountRawAssign.assignFromAccountRaw(accountRaw, account);
  hederaAssignFromAccountRaw(accountRaw, account);
  toStandardSwapOperationIds(account);
}

export default {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
};
