import { BigNumber } from "bignumber.js";
import type { IconResourcesRaw, IconResources, IconAccount, IconAccountRaw } from "./types";
import { AccountRaw, Account } from "@ledgerhq/types-live";

export function toIconResourcesRaw(resources: IconResources): IconResourcesRaw {
  const { nonce, votingPower, totalDelegated } = resources;
  return {
    nonce,
    votingPower: votingPower.toString(),
    totalDelegated: totalDelegated.toString(),
  };
}

export function fromIconResourcesRaw(rawResources: IconResourcesRaw): IconResources {
  const { nonce, votingPower, totalDelegated } = rawResources;
  return {
    nonce,
    votingPower: new BigNumber(votingPower || 0),
    totalDelegated: new BigNumber(totalDelegated || 0),
  };
}

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw): void {
  const iconAccount = account as IconAccount;
  if (iconAccount.iconResources) {
    (accountRaw as IconAccountRaw).iconResources = toIconResourcesRaw(iconAccount.iconResources);
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account) {
  const iconResourcesRaw = (accountRaw as IconAccountRaw).iconResources;
  if (iconResourcesRaw)
    (account as IconAccount).iconResources = fromIconResourcesRaw(iconResourcesRaw);
}
