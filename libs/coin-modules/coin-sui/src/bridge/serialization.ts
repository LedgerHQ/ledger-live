import { Account, AccountRaw } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type { SuiAccount, SuiAccountRaw, SuiResourcesRaw, SuiResources } from "../types";

export function toSuiResourcesRaw(r: SuiResources): SuiResourcesRaw {
  const { nonce, additionalBalance } = r;
  return {
    nonce,
    additionalBalance: additionalBalance.toString(),
  };
}

export function fromSuiResourcesRaw(r: SuiResourcesRaw): SuiResources {
  const { nonce, additionalBalance } = r;
  return {
    nonce,
    additionalBalance: BigNumber(additionalBalance),
  };
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
