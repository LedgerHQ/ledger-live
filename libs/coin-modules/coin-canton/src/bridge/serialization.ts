import type { Account, AccountRaw } from "@ledgerhq/types-live";
import {
  type CantonAccount,
  type CantonAccountRaw,
  type CantonResources,
  type CantonResourcesRaw,
} from "../types";

export function isCantonAccount(account: Account): account is CantonAccount {
  return "cantonResources" in account;
}

function isCantonAccountRaw(accountRaw: AccountRaw): accountRaw is CantonAccountRaw {
  return "cantonResources" in accountRaw;
}

function toResourcesRaw(r: CantonResources): CantonResourcesRaw {
  const { instrumentUtxoCounts, pendingTransferProposals, publicKey } = r;
  return {
    instrumentUtxoCounts,
    pendingTransferProposals,
    ...(publicKey !== undefined && { publicKey }),
  };
}

function fromResourcesRaw(r: CantonResourcesRaw): CantonResources {
  return {
    instrumentUtxoCounts: r.instrumentUtxoCounts,
    pendingTransferProposals: r.pendingTransferProposals,
    ...(r.publicKey !== undefined && { publicKey: r.publicKey }),
  };
}

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw): void {
  if (isCantonAccount(account) && isCantonAccountRaw(accountRaw)) {
    if (account.cantonResources) {
      accountRaw.cantonResources = toResourcesRaw(account.cantonResources);
    }
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account): void {
  if (isCantonAccountRaw(accountRaw) && isCantonAccount(account)) {
    if (accountRaw.cantonResources) {
      account.cantonResources = fromResourcesRaw(accountRaw.cantonResources);
    }
  }
}
