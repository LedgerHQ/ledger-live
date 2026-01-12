import BigNumber from "bignumber.js";
import type { AccountRaw, Account } from "@ledgerhq/types-live";
import type { AleoAccount, AleoAccountRaw, AleoResources, AleoResourcesRaw } from "../types";

export function toAleoResourcesRaw(resources: AleoResources): AleoResourcesRaw {
  return {
    transparentBalance: resources.transparentBalance.toString(),
    privateBalance: resources.privateBalance?.toString() ?? null,
  };
}

export function fromAleoResourcesRaw(rawResources: AleoResourcesRaw): AleoResources {
  return {
    transparentBalance: new BigNumber(rawResources.transparentBalance),
    privateBalance: rawResources.privateBalance ? new BigNumber(rawResources.privateBalance) : null,
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
