import { BigNumber } from "bignumber.js";
import type { IconResourcesRaw, IconResources, IconAccount, IconAccountRaw } from "./types";
import { AccountRaw, Account } from "@ledgerhq/types-live";

export function toIconResourcesRaw(r: IconResources): IconResourcesRaw {
  const { nonce, additionalBalance } = r;
  return {
    nonce,
    additionalBalance: additionalBalance.toString(),
  };
}

export function fromIconResourcesRaw(r: IconResourcesRaw): IconResources {
  const { nonce, additionalBalance } = r;
  return {
    nonce,
    additionalBalance: new BigNumber(additionalBalance),
  };
}

export function assignToAccountRaw(
  account: Account,
  accountRaw: AccountRaw
): void {
  const iconAccount = account as IconAccount;
  if (iconAccount.iconResources) {
    (accountRaw as IconAccountRaw).iconResources = toIconResourcesRaw(
      iconAccount.iconResources
    );
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account) {
  const iconResourcesRaw = (accountRaw as IconAccountRaw)
    .iconResources;
  if (iconResourcesRaw)
    (account as IconAccount).iconResources =
    fromIconResourcesRaw(iconResourcesRaw);
}