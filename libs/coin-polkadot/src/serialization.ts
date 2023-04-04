import { BigNumber } from "bignumber.js";
import type {
  PolkadotResourcesRaw,
  PolkadotResources,
  PolkadotAccount,
  PolkadotAccountRaw,
} from "./types";
import { Account, AccountRaw } from "@ledgerhq/types-live";

export function toPolkadotResourcesRaw(
  r: PolkadotResources
): PolkadotResourcesRaw {
  const { nonce, controller, stash } = r;
  return {
    controller,
    stash,
    nonce,
    lockedBalance: r.lockedBalance.toString(),
    unlockedBalance: r.unlockedBalance.toString(),
    unlockingBalance: r.unlockingBalance.toString(),
    unlockings: r.unlockings?.map((u) => ({
      amount: u.amount.toString(),
      completionDate: u.completionDate.toISOString(),
    })),
    nominations: r.nominations?.map((n) => ({
      address: n.address,
      value: n.value.toString(),
      status: n.status,
    })),
    numSlashingSpans: r.numSlashingSpans,
  };
}
export function fromPolkadotResourcesRaw(
  r: PolkadotResourcesRaw
): PolkadotResources {
  const { nonce, controller, stash } = r;
  return {
    controller,
    stash,
    nonce,
    lockedBalance: new BigNumber(r.lockedBalance),
    unlockedBalance: new BigNumber(r.unlockedBalance),
    unlockingBalance: new BigNumber(r.unlockingBalance),
    unlockings: r.unlockings?.map((u) => ({
      amount: new BigNumber(u.amount),
      completionDate: new Date(u.completionDate),
    })),
    nominations: r.nominations?.map((n) => ({
      address: n.address,
      value: new BigNumber(n.value),
      status: n.status,
    })),
    numSlashingSpans: Number(r.numSlashingSpans) || 0,
  };
}

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw) {
  const polkadotAccount = account as PolkadotAccount;
  if (polkadotAccount.polkadotResources) {
    (accountRaw as PolkadotAccountRaw).polkadotResources =
      toPolkadotResourcesRaw(polkadotAccount.polkadotResources);
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account) {
  const polkadotResourcesRaw = (accountRaw as PolkadotAccountRaw)
    .polkadotResources;
  if (polkadotResourcesRaw)
    (account as PolkadotAccount).polkadotResources =
      fromPolkadotResourcesRaw(polkadotResourcesRaw);
}
