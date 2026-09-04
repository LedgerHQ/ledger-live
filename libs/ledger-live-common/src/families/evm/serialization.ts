import type { Account, AccountRaw } from "@ledgerhq/types-live";
import {
  assignStakingResourcesFromAccountRaw,
  assignStakingResourcesToAccountRaw,
} from "@ledgerhq/ledger-wallet-framework/serialization";

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw): void {
  assignStakingResourcesToAccountRaw(account, accountRaw);
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account): void {
  assignStakingResourcesFromAccountRaw(accountRaw, account);
}
