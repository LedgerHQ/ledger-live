import type { AccountRaw, Account } from "@ledgerhq/types-live";
import type {
  HederaAccount,
  HederaAccountRaw,
  HederaResources,
  HederaResourcesRaw,
} from "../types";

export function toHederaResourcesRaw(resources: HederaResources): HederaResourcesRaw {
  const { maxAutomaticTokenAssociations, isAutoTokenAssociationEnabled } = resources;

  return {
    maxAutomaticTokenAssociations,
    isAutoTokenAssociationEnabled,
  };
}

export function fromHederaResourcesRaw(rawResources: HederaResourcesRaw): HederaResources {
  const { maxAutomaticTokenAssociations, isAutoTokenAssociationEnabled } = rawResources;

  return {
    maxAutomaticTokenAssociations,
    isAutoTokenAssociationEnabled,
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
