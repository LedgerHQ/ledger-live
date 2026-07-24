import type { AccountRaw, Account, OperationType } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type {
  HederaAccount,
  HederaAccountRaw,
  HederaResources,
  HederaResourcesRaw,
} from "../types";

export function toHederaResourcesRaw(resources: HederaResources): HederaResourcesRaw {
  const { maxAutomaticTokenAssociations, isAutoTokenAssociationEnabled } = resources;
  const delegation = resources.delegation
    ? {
        nodeId: resources.delegation.nodeId,
        delegated: resources.delegation.delegated.toString(),
        pendingReward: resources.delegation.pendingReward.toString(),
      }
    : null;

  return {
    maxAutomaticTokenAssociations,
    isAutoTokenAssociationEnabled,
    delegation,
  };
}

export function fromHederaResourcesRaw(rawResources: HederaResourcesRaw): HederaResources {
  const { maxAutomaticTokenAssociations, isAutoTokenAssociationEnabled } = rawResources;
  const delegation = rawResources.delegation
    ? {
        nodeId: rawResources.delegation.nodeId,
        delegated: new BigNumber(rawResources.delegation.delegated),
        pendingReward: new BigNumber(rawResources.delegation.pendingReward),
      }
    : null;

  return {
    maxAutomaticTokenAssociations,
    isAutoTokenAssociationEnabled,
    delegation,
  };
}

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw): void {
  const hederaAccount = account as HederaAccount;
  const hederaAccountRaw = accountRaw as HederaAccountRaw;

  if (hederaAccount.hederaResources) {
    hederaAccountRaw.hederaResources = toHederaResourcesRaw(hederaAccount.hederaResources);
  }
}

// The only operation types allowed to parent token operations (see prepareOperations):
// FEES (fee of a token transfer) and NONE (anchor of an orphan token operation).
const TOKEN_PARENT_OPERATION_TYPES = new Set<OperationType>(["FEES", "NONE"]);

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account) {
  const hederaAccount = account as HederaAccount;
  const hederaAccountRaw = accountRaw as HederaAccountRaw;

  if (hederaAccountRaw.hederaResources) {
    hederaAccount.hederaResources = fromHederaResourcesRaw(hederaAccountRaw.hederaResources);
  }

  // fromAccountRaw rebuilds subOperations with inferSubOperations, which attaches
  // every token operation sharing the tx hash to every coin operation of that tx.
  // A value coin operation of a multi-asset tx must not list them, so re-apply
  // the prepareOperations parenting rule after deserialization.
  account.operations = account.operations.map(op =>
    op.subOperations?.length && !TOKEN_PARENT_OPERATION_TYPES.has(op.type)
      ? { ...op, subOperations: [] }
      : op,
  );
}
