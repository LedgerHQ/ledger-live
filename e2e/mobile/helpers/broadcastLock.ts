import path from "node:path";
import {
  acquireAccountBroadcastLock,
  BROADCAST_LOCK_ACQUIRE_TIMEOUT_MS,
  BROADCAST_LOCK_NESTED_DRAIN_MS,
  refuseAccountBroadcastLocks,
  takeBroadcastLockWaitedMs,
  tryAcquireAccountBroadcastLock,
  type Lease,
  type LockTarget,
  type SharedResource,
} from "@ledgerhq/live-e2e-shared/broadcastLock";
import type { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { isAppBroadcastDisabled } from "@e2e/helpers/commonHelpers";
import { SPEC_BROADCAST_LOCK, type SpecBroadcastLock } from "@e2e/utils/broadcastDeferrals";

export const BROADCAST_LOCK_ACQUIRE_HOOK_TIMEOUT = BROADCAST_LOCK_ACQUIRE_TIMEOUT_MS + 2 * 60_000;
export const BROADCAST_LOCK_RELEASE_HOOK_TIMEOUT = BROADCAST_LOCK_NESTED_DRAIN_MS + 60_000;

const declaredAccounts: Account[] = [];
const declaredResources: SharedResource[] = [];
let lease: Lease | undefined;
let specFinished = false;

const accountsToLock = () => (isAppBroadcastDisabled() ? [] : declaredAccounts);
const targetsToLock = (): LockTarget[] => [...accountsToLock(), ...declaredResources];

const holderLabel = () => {
  const platform = process.env.DETOX_CONFIGURATION?.startsWith("ios") ? "ios" : "android";
  const specFile = path.basename(expect.getState().testPath ?? "unknown spec");
  return `${platform} ${specFile}`;
};

/**
 * Declares, while the spec file is collected, an account the app broadcasts from.
 * setup.ts locks them before the app starts, unless app broadcast is disabled, and releases
 * them once every afterAll has run, so no other worker or CI machine broadcasts from them in between.
 */
export function declareBroadcastAccounts(...accounts: Account[]): void {
  declaredAccounts.push(...accounts);
}

/**
 * Declares, while the spec file is collected, shared state the spec changes even with app
 * broadcast disabled, e.g. the Pay card it freezes. It is locked along with the broadcast accounts.
 */
export function declareSharedResources(...resources: SharedResource[]): void {
  declaredResources.push(...resources);
}

async function tryLockDeclaredBroadcastAccounts(): Promise<"none" | "held" | "busy"> {
  const targets = targetsToLock();
  if (targets.length === 0 || lease) return "none";
  const acquired = await tryAcquireAccountBroadcastLock(targets, holderLabel(), {
    allowNested: true,
  });
  if (!acquired) return "busy";
  lease = acquired;
  return "held";
}

export async function lockDeclaredBroadcastAccounts(): Promise<void> {
  const targets = targetsToLock();
  if (targets.length === 0 || lease) return;
  const label = holderLabel();
  let acquired: Lease;
  try {
    acquired = await acquireAccountBroadcastLock(targets, label, { allowNested: true });
  } catch (error) {
    if (!specFinished) {
      lease = refuseAccountBroadcastLocks(targets, `could not be locked by ${label}`);
    }
    throw error;
  }
  if (specFinished) {
    await acquired.release();
    return;
  }
  lease = acquired;
}

export async function releaseDeclaredBroadcastAccounts(): Promise<void> {
  specFinished = true;
  const held = lease;
  lease = undefined;
  await held?.release();
}

const specBroadcastLock: SpecBroadcastLock = {
  tryLock: tryLockDeclaredBroadcastAccounts,
  release: releaseDeclaredBroadcastAccounts,
  takeWaitedMs: takeBroadcastLockWaitedMs,
};
Reflect.set(globalThis, SPEC_BROADCAST_LOCK, specBroadcastLock);
