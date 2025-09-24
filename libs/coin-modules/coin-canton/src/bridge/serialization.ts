import type { Account, AccountRaw } from "@ledgerhq/types-live";
import type {
  CantonAccount,
  CantonAccountRaw,
  CantonResources,
  CantonResourcesRaw,
} from "../types";

function toResourcesRaw(_r: CantonResources): CantonResourcesRaw {
  return {};
}
function fromResourcesRaw(_r: CantonResourcesRaw): CantonResources {
  return {};
}

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw): void {
  const cantonAccount = account as CantonAccount;
  const cantonAccountRaw = accountRaw as CantonAccountRaw;
  if (cantonAccount.cantonResources) {
    cantonAccountRaw.cantonResources = toResourcesRaw(cantonAccount.cantonResources);
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account): void {
  const cantonResourcesRaw = (accountRaw as CantonAccountRaw).cantonResources;
  const cantonAccount = account as CantonAccount;
  if (cantonResourcesRaw) {
    cantonAccount.cantonResources = fromResourcesRaw(cantonResourcesRaw);
  }
}
