import path from "node:path";
import {
  acquireExclusiveLock,
  EXCLUSIVE_LOCK_ACQUIRE_TIMEOUT_MS,
  EXCLUSIVE_LOCK_NESTED_DRAIN_MS,
  refuseExclusiveLocks,
  shouldLockBroadcastAccounts,
  takeExclusiveLockWaitedMs,
  tryAcquireExclusiveLock,
  type AbandonableLease,
  type Lease,
  type LockTarget,
  type SharedResource,
} from "@ledgerhq/live-e2e-shared/exclusiveLock";
import type { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { isAppBroadcastDisabled } from "@e2e/helpers/commonHelpers";
import { SPEC_EXCLUSIVE_LOCK, type SpecExclusiveLock } from "@e2e/utils/lockDeferrals";
import { isPaytabSpec, paytabCardSession } from "@e2e/utils/paytab";

export const EXCLUSIVE_LOCK_ACQUIRE_HOOK_TIMEOUT = EXCLUSIVE_LOCK_ACQUIRE_TIMEOUT_MS + 2 * 60_000;
export const EXCLUSIVE_LOCK_RELEASE_HOOK_TIMEOUT = EXCLUSIVE_LOCK_NESTED_DRAIN_MS + 60_000;

const declaredAccounts: Account[] = [];
const declaredCliAccounts: Account[] = [];
const declaredResources: SharedResource[] = [];
let lease: Lease | undefined;
let specFinished = false;

const accountsToLock = () =>
  shouldLockBroadcastAccounts(!isAppBroadcastDisabled()) ? declaredAccounts : [];
const targetsToLock = (): LockTarget[] => [
  ...accountsToLock(),
  ...declaredCliAccounts,
  ...declaredResources,
];

/** CLI broadcasts wait for their confirmation, so only an app broadcast leaves a settle window. */
const specLease = (acquired: AbandonableLease): Lease =>
  accountsToLock().length > 0 ? acquired : { release: () => acquired.abandon() };

export const holderLabel = () => {
  const platform = process.env.DETOX_CONFIGURATION?.startsWith("ios") ? "ios" : "android";
  const specFile = path.basename(expect.getState().testPath ?? "unknown spec");
  return `${platform} ${specFile}`;
};

const lockOptions = { allowNested: true };

/**
 * Declares, while the spec file is collected, an account the app broadcasts from.
 * setup.ts locks them before the app starts, unless app broadcast is disabled (and
 * E2E_EXCLUSIVE_LOCK_WITHOUT_BROADCAST is not "1"), and releases them once the spec's describe
 * blocks have run, so no other worker or CI machine broadcasts from them in between. A spec's
 * file-level afterAll runs after that release, so a cleanup that broadcasts goes in a describe.
 */
export function declareBroadcastAccounts(...accounts: Account[]): void {
  declaredAccounts.push(...accounts);
}

/**
 * Declares, while the spec file is collected, an account the spec broadcasts from with the CLI,
 * e.g. a token approval. It is locked on every run along with the broadcast accounts, and the CLI
 * broadcast runs under that lock.
 */
export function declareCliBroadcastAccounts(...accounts: Account[]): void {
  declaredCliAccounts.push(...accounts);
}

/**
 * Declares, while the spec file is collected, shared state the spec changes even with app
 * broadcast disabled, e.g. the Pay card it freezes. It is locked along with the broadcast accounts.
 */
export function declareSharedResources(...resources: SharedResource[]): void {
  declaredResources.push(...resources);
}

/**
 * A Pay tab spec gets its card session before waiting for its locks, or right after trying them,
 * so a Baanx failure never holds them and a spec deferred for busy locks does not log in.
 */
const resolvePaytabCardSession = async () => {
  if (isPaytabSpec()) await paytabCardSession();
};

async function tryLockDeclaredTargets(): Promise<boolean> {
  const targets = targetsToLock();
  if (targets.length === 0 || lease) return true;
  const acquired = await tryAcquireExclusiveLock(targets, holderLabel(), lockOptions);
  if (!acquired) return false;
  try {
    await resolvePaytabCardSession();
  } catch (error) {
    await acquired.abandon();
    throw error;
  }
  lease = specLease(acquired);
  return true;
}

export async function lockDeclaredTargets(): Promise<void> {
  const targets = targetsToLock();
  if (targets.length === 0 || lease) return;
  await resolvePaytabCardSession();
  const label = holderLabel();
  let acquired: AbandonableLease;
  try {
    acquired = await acquireExclusiveLock(targets, label, lockOptions);
  } catch (error) {
    if (!specFinished) {
      lease = refuseExclusiveLocks(targets, `could not be locked by ${label}`);
    }
    throw error;
  }
  if (specFinished) {
    await acquired.abandon();
    return;
  }
  lease = specLease(acquired);
}

export async function releaseDeclaredTargets(): Promise<void> {
  specFinished = true;
  const held = lease;
  lease = undefined;
  await held?.release();
}

const specExclusiveLock: SpecExclusiveLock = {
  tryLock: tryLockDeclaredTargets,
  release: releaseDeclaredTargets,
  takeWaitedMs: takeExclusiveLockWaitedMs,
};
Reflect.set(globalThis, SPEC_EXCLUSIVE_LOCK, specExclusiveLock);
