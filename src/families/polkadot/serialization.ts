import { BigNumber } from "bignumber.js";
import type { PolkadotResourcesRaw, PolkadotResources } from "./types";
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
