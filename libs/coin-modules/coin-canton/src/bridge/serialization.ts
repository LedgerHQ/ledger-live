import type { Account, AccountRaw } from "@ledgerhq/types-live";
import type {
  CantonAccount,
  CantonAccountRaw,
  CantonResources,
  CantonResourcesRaw,
} from "../types";

function toResourcesRaw(r: CantonResources): CantonResourcesRaw {
  const { partyId } = r;
  return {
    partyId,
  };
}
function fromResourcesRaw(r: CantonResourcesRaw): CantonResources {
  const { partyId } = r;
  return {
    partyId,
  };
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
