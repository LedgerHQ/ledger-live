import { Account, AccountRaw } from "@ledgerhq/types-live";
import type { SuiAccount, SuiAccountRaw, SuiResourcesRaw, SuiResources } from "../types";

export function toSuiResourcesRaw(_resources: SuiResources): SuiResourcesRaw {
  return {};
}

export function fromSuiResourcesRaw(_resources: SuiResourcesRaw): SuiResources {
  return {};
}

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw) {
  const suiAccount = account as SuiAccount;
  const suiAccountRaw = accountRaw as SuiAccountRaw;
  if (suiAccount.suiResources) {
    suiAccountRaw.suiResources = toSuiResourcesRaw(suiAccount.suiResources);
  }
}
export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account) {
  const suiResourcesRaw = (accountRaw as SuiAccountRaw).suiResources;
  if (suiResourcesRaw) {
    (account as SuiAccount).suiResources = fromSuiResourcesRaw(suiResourcesRaw);
  }
}
