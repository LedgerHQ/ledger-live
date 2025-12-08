import BigNumber from "bignumber.js";
import type { AccountRaw, Account } from "@ledgerhq/types-live";
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

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account) {
  const hederaAccount = account as HederaAccount;
  const hederaAccountRaw = accountRaw as HederaAccountRaw;

  if (hederaAccountRaw.hederaResources) {
    hederaAccount.hederaResources = fromHederaResourcesRaw(hederaAccountRaw.hederaResources);
  }
}
