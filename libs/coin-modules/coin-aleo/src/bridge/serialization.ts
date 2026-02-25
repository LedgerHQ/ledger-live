import BigNumber from "bignumber.js";
import type { AccountRaw, Account } from "@ledgerhq/types-live";
import type { AleoAccount, AleoAccountRaw, AleoResources, AleoResourcesRaw } from "../types";

export function toAleoResourcesRaw(resources: AleoResources): AleoResourcesRaw {
  return {
    transparentBalance: resources.transparentBalance.toString(),
    privateBalance: resources.privateBalance?.toString() ?? null,
    provableApi: resources.provableApi ? JSON.stringify(resources.provableApi) : null,
    lastPrivateSyncDate: resources.lastPrivateSyncDate
      ? resources.lastPrivateSyncDate.toISOString()
      : null,
    unspentPrivateRecords: resources.unspentPrivateRecords
      ? JSON.stringify(resources.unspentPrivateRecords)
      : null,
  };
}

export function fromAleoResourcesRaw(rawResources: AleoResourcesRaw): AleoResources {
  return {
    transparentBalance: new BigNumber(rawResources.transparentBalance),
    privateBalance: rawResources.privateBalance ? new BigNumber(rawResources.privateBalance) : null,
    provableApi: rawResources.provableApi ? JSON.parse(rawResources.provableApi) : null,
    lastPrivateSyncDate: rawResources.lastPrivateSyncDate
      ? new Date(rawResources.lastPrivateSyncDate)
      : null,
    unspentPrivateRecords: rawResources.unspentPrivateRecords
      ? JSON.parse(rawResources.unspentPrivateRecords)
      : null,
  };
}

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw): void {
  const aleoAccount = account as AleoAccount;
  const aleoAccountRaw = accountRaw as AleoAccountRaw;

  if (aleoAccount.aleoResources) {
    aleoAccountRaw.aleoResources = toAleoResourcesRaw(aleoAccount.aleoResources);
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account) {
  const aleoAccount = account as AleoAccount;
  const aleoAccountRaw = accountRaw as AleoAccountRaw;

  if (aleoAccountRaw.aleoResources) {
    aleoAccount.aleoResources = fromAleoResourcesRaw(aleoAccountRaw.aleoResources);
  }
}
