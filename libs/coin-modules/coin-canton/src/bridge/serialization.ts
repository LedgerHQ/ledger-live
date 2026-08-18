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

function toResourcesRaw(r: CantonResources): CantonResourcesRaw {
  const { isOnboarded, instrumentUtxoCounts, pendingTransferProposals, publicKey, xpub } = r;
  return {
    isOnboarded: isOnboarded,
    instrumentUtxoCounts,
    pendingTransferProposals,
    ...(publicKey ? { publicKey } : {}),
    ...(xpub ? { xpub } : {}),
  };
}

function fromResourcesRaw(r: CantonResourcesRaw): CantonResources {
  return {
    isOnboarded: r.isOnboarded,
    instrumentUtxoCounts: r.instrumentUtxoCounts,
    pendingTransferProposals: r.pendingTransferProposals,
    ...(r.publicKey ? { publicKey: r.publicKey } : {}),
    ...(r.xpub ? { xpub: r.xpub } : {}),
  };
}

// Guard on the source only: the serializer passes a freshly-built destination
// with no cantonResources yet, so a destination guard would drop the block. LIVE-34585
export function assignToAccountRaw(account: Account, accountRaw: AccountRaw): void {
  if (isCantonAccount(account) && account.cantonResources) {
    (accountRaw as CantonAccountRaw).cantonResources = toResourcesRaw(account.cantonResources);
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account): void {
  const { cantonResources } = accountRaw as CantonAccountRaw;
  if (cantonResources) {
    (account as CantonAccount).cantonResources = fromResourcesRaw(cantonResources);
  }
}
