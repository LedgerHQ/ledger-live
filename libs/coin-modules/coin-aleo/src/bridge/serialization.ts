import BigNumber from "bignumber.js";
import type { AccountRaw, Account } from "@ledgerhq/types-live";
import type { AleoAccount, AleoAccountRaw, AleoResources, AleoResourcesRaw } from "../types";

export function toAleoResourcesRaw(resources: AleoResources): AleoResourcesRaw {
  return {
    transparentBalance: resources.transparentBalance.toString(),
    privateBalance: resources.privateBalance?.toString() ?? null,
    lastPrivateSyncDate: resources.lastPrivateSyncDate
      ? resources.lastPrivateSyncDate.toISOString()
      : null,
    privateRecords: resources.privateRecords ? JSON.stringify(resources.privateRecords) : null,
    provableApi: resources.provableApi ? JSON.stringify(resources.provableApi) : null,
  };
}

export function fromAleoResourcesRaw(rawResources: AleoResourcesRaw): AleoResources {
  return {
    transparentBalance: new BigNumber(rawResources.transparentBalance),
    privateBalance: rawResources.privateBalance ? new BigNumber(rawResources.privateBalance) : null,
    lastPrivateSyncDate: rawResources.lastPrivateSyncDate
      ? new Date(rawResources.lastPrivateSyncDate)
      : null,
    privateRecords: rawResources.privateRecords ? JSON.parse(rawResources.privateRecords) : null,
    provableApi: rawResources.provableApi ? JSON.parse(rawResources.provableApi) : null,
  };
}

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw): void {
  const aleoAccount = account as AleoAccount;
  const aleoAccountRaw = accountRaw as AleoAccountRaw;

  aleoAccountRaw.aleoResources = toAleoResourcesRaw(aleoAccount.aleoResources);
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account) {
  const aleoAccount = account as AleoAccount;
  const aleoAccountRaw = accountRaw as AleoAccountRaw;

  aleoAccount.aleoResources = fromAleoResourcesRaw(aleoAccountRaw.aleoResources);
}
