// How the lock works, how tests declare it, and how to read its logs: e2e/docs/exclusive-lock.md
import { randomUUID } from "node:crypto";
import os from "node:os";
import { byCodeUnit } from "./exclusiveLock/byCodeUnit";
import { acquireDistributedLock } from "./exclusiveLock/distributedLock";
import { ExclusiveLockConfigError, ExclusiveLockRefusedError } from "./errors";
import { createR2LockStore } from "./exclusiveLock/r2LockStore";
import { acquireCrossProcessLock } from "./crossProcessLock";
import type { AbandonableLease, Lease, LockLogger, LockStore } from "./exclusiveLock/types";
import type { Account } from "./enum/Account";

export type { AbandonableLease, Lease } from "./exclusiveLock/types";

export const EXCLUSIVE_LOCK_ACQUIRE_TIMEOUT_MS = 30 * 60_000;
export const EXCLUSIVE_LOCK_NESTED_DRAIN_MS = 60_000;
const LEASE_MS = 120_000;
// A lease of failed requests: by then every holder has lost its lock too.
const STORE_OUTAGE_MS = LEASE_MS;
const HEARTBEAT_MS = 20_000;
const POLL_MS = 5_000;
const HIGH_PRIORITY_POLL_MS = 1_000;
// How long a lock attempt that must not wait keeps retrying lock store errors.
const TRY_LOCK_STORE_RETRY_MS = 30_000;
// Long enough for the last transaction to reach the nodes the next holder reads its nonce from.
const SETTLE_MS = 45_000;
const SETTLE_CLAIM_SPREAD_MS = 1_500;
// The high-priority spread plus 2 s, over the lock store's 1 s age rounding either way, so
// high-priority waiters still claim a settled key before the others.
const SETTLE_CLAIM_HEAD_START_MS = 3_500;
const R2_KEY_PREFIX = "e2e-broadcast-locks/";
const HOLDER_PREFIX = `${os.hostname()}:${process.pid}:`;
const LIVE_HOLDS = Symbol.for("@ledgerhq/live-e2e-shared/exclusiveLock/liveHolds");
const WAITED_MS = Symbol.for("@ledgerhq/live-e2e-shared/exclusiveLock/waitedMs");

// Detox runs on CI at --loglevel warn, which drops console.info.
const consoleLogger: LockLogger = {
  info: message => console.warn(message),
  warn: message => console.warn(message),
};

type LiveHold = {
  nested: number;
  nestedBroadcast?: boolean;
  onNestedDone?: () => void;
  refusedBecause?: string;
};
type LiveHolds = Record<string, LiveHold>;

type ExclusiveLockOptions = { readonly allowNested?: boolean };

const isLiveHolds = (value: unknown): value is LiveHolds =>
  typeof value === "object" && value !== null;

/**
 * The holds of this process that nested calls may join, keyed by lock key. Jest gives the spec
 * file and jest.environment.ts their own globals and module copies but the same core modules, so
 * the registry hangs off node:os for a helper in one to see a lock taken in the other.
 */
function liveHolds(): LiveHolds {
  const existing: unknown = Reflect.get(os, LIVE_HOLDS);
  if (isLiveHolds(existing)) return existing;
  const created: LiveHolds = {};
  Reflect.set(os, LIVE_HOLDS, created);
  return created;
}

/**
 * Two accounts collide on-chain when they share the chain and the derivation path: a token
 * account spends from its parent's address, and EVM nonces are per chain.
 */
export function accountLockKey(account: Account): string {
  const owner = account.parentAccount ?? account;
  return `${owner.currency.id}:${owner.accountPath}`;
}

/**
 * Off-chain state that tests on several machines change, locked like an on-chain account but
 * handed back without the settle window: it has no nonce to propagate.
 */
export type SharedResource = { readonly lockKey: string };

/** The card of the Baanx sandbox user every Pay tab suite signs in as, which freeze tests toggle. */
export const PAY_CARD: SharedResource = { lockKey: "pay-card" };

export type LockTarget = Account | SharedResource;

const isSharedResource = (target: LockTarget): target is SharedResource => "lockKey" in target;

const lockTargetKey = (target: LockTarget): string =>
  isSharedResource(target) ? target.lockKey : accountLockKey(target);

/** The distinct keys of `targets`, in the order every holder takes them, so none deadlock. */
export const lockKeys = (targets: readonly LockTarget[]): string[] =>
  [...new Set(targets.map(target => lockTargetKey(target)))].sort(byCodeUnit);

const waitedMsSoFar = (): number => {
  const waited: unknown = Reflect.get(os, WAITED_MS);
  return typeof waited === "number" ? waited : 0;
};

/**
 * Time this process spent acquiring exclusive locks since the last call. Kept on node:os, like the
 * live holds, so jest.environment.ts can read what the spec file's module copies waited.
 */
export function takeExclusiveLockWaitedMs(): number {
  const waited = waitedMsSoFar();
  Reflect.set(os, WAITED_MS, 0);
  return waited;
}

/** "local" locks on this machine only, even on CI, e.g. while R2 is down. */
const EXCLUSIVE_LOCK_MODE_ENV = "E2E_EXCLUSIVE_LOCK_MODE";

const isMachineLocalMode = (): boolean => {
  const mode = process.env[EXCLUSIVE_LOCK_MODE_ENV] || "remote";
  if (mode !== "remote" && mode !== "local") {
    throw new ExclusiveLockConfigError(
      `[exclusiveLock] ${EXCLUSIVE_LOCK_MODE_ENV} must be "remote" or "local", not "${mode}"`,
    );
  }
  return mode === "local";
};

/** "high" for release and hotfix runs: their waiters poll faster and claim a released key first. */
const EXCLUSIVE_LOCK_PRIORITY_ENV = "E2E_EXCLUSIVE_LOCK_PRIORITY";

const isHighPriority = (): boolean => {
  const priority = process.env[EXCLUSIVE_LOCK_PRIORITY_ENV] || "normal";
  if (priority !== "normal" && priority !== "high") {
    throw new ExclusiveLockConfigError(
      `[exclusiveLock] ${EXCLUSIVE_LOCK_PRIORITY_ENV} must be "normal" or "high", not "${priority}"`,
    );
  }
  return priority === "high";
};

function remoteLockStoreFromEnv(): LockStore | undefined {
  if (isMachineLocalMode()) return undefined;
  const endpoint = process.env.E2E_EXCLUSIVE_LOCK_ENDPOINT;
  const bucket = process.env.E2E_EXCLUSIVE_LOCK_BUCKET;
  const accessKeyId = process.env.E2E_EXCLUSIVE_LOCK_ACCESS_KEY_ID;
  const secretAccessKey = process.env.E2E_EXCLUSIVE_LOCK_SECRET_ACCESS_KEY;
  if (!endpoint && !bucket && !accessKeyId && !secretAccessKey) return undefined;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    throw new ExclusiveLockConfigError(
      "[exclusiveLock] E2E_EXCLUSIVE_LOCK_ENDPOINT, _BUCKET, _ACCESS_KEY_ID and _SECRET_ACCESS_KEY must be set together",
    );
  }
  return createR2LockStore({
    endpoint,
    bucket,
    prefix: R2_KEY_PREFIX,
    credentials: { accessKeyId, secretAccessKey },
  });
}

let warnedMachineLocal = false;

async function acquireMachineLocalLock(
  key: string,
  acquireTimeoutMs: number,
): Promise<AbandonableLease> {
  const localMode = isMachineLocalMode();
  if (process.env.CI && !localMode) {
    throw new ExclusiveLockConfigError(
      `[exclusiveLock] E2E_EXCLUSIVE_LOCK_* must be set on CI: a machine-local lock on "${key}" does not stop other CI machines from broadcasting from it`,
    );
  }
  if (!warnedMachineLocal) {
    warnedMachineLocal = true;
    const reason = localMode
      ? `${EXCLUSIVE_LOCK_MODE_ENV} is "local"`
      : "E2E_EXCLUSIVE_LOCK_* is not set";
    console.warn(
      `[exclusiveLock] ${reason}: broadcasts are only serialized between processes on this machine`,
    );
  }
  const release = await acquireCrossProcessLock(key, { acquireTimeoutMs });
  return { release, abandon: release };
}

function joinHold(outer: LiveHold): AbandonableLease {
  outer.nested++;
  let left = false;
  const leave = (mayHaveBroadcast: boolean) => {
    if (!left) {
      left = true;
      if (mayHaveBroadcast) outer.nestedBroadcast = true;
      outer.nested--;
      if (outer.nested === 0) outer.onNestedDone?.();
    }
    return Promise.resolve();
  };
  return { release: () => leave(true), abandon: () => leave(false) };
}

/** Keeps the lease, and its heartbeat, until every broadcast nested in it ends, however long. */
async function waitForNestedHolds(key: string, hold: LiveHold): Promise<void> {
  if (hold.nested === 0) return;
  const slowDrainWarning = setTimeout(() => {
    console.warn(
      `[exclusiveLock] keeping "${key}" locked while a broadcast nested in it still runs after ${EXCLUSIVE_LOCK_NESTED_DRAIN_MS}ms`,
    );
  }, EXCLUSIVE_LOCK_NESTED_DRAIN_MS);
  await new Promise<void>(resolve => {
    hold.onNestedDone = resolve;
  });
  clearTimeout(slowDrainWarning);
}

type KeyLockOptions = {
  readonly allowNested: boolean;
  readonly deadline: number;
  readonly giveUpIfHeld: boolean;
  readonly sharedResourceKeys: ReadonlySet<string>;
};

async function acquireKey(
  key: string,
  label: string,
  { allowNested, deadline, giveUpIfHeld, sharedResourceKeys }: KeyLockOptions,
): Promise<AbandonableLease> {
  const holds = liveHolds();
  const outer = holds[key];
  if (outer?.refusedBecause && !allowNested) {
    throw new ExclusiveLockRefusedError(`[exclusiveLock] "${key}" ${outer.refusedBecause}`);
  }
  if (outer && !allowNested) return joinHold(outer);

  const hold: LiveHold = { nested: 0 };
  const forget = () => {
    if (holds[key] === hold) Reflect.deleteProperty(holds, key);
  };
  const acquireTimeoutMs = Math.max(0, deadline - Date.now());
  const highPriority = isHighPriority();
  const store = remoteLockStoreFromEnv();
  const lease = store
    ? await acquireDistributedLock(store, key, {
        holder: `${HOLDER_PREFIX}${randomUUID()}`,
        label,
        leaseMs: LEASE_MS,
        settleMs: sharedResourceKeys.has(key) ? 0 : SETTLE_MS,
        heartbeatMs: HEARTBEAT_MS,
        pollMs: highPriority ? HIGH_PRIORITY_POLL_MS : POLL_MS,
        acquireTimeoutMs: giveUpIfHeld
          ? Math.min(TRY_LOCK_STORE_RETRY_MS, acquireTimeoutMs)
          : acquireTimeoutMs,
        storeOutageMs: STORE_OUTAGE_MS,
        giveUpWhenHeld: giveUpIfHeld,
        settleClaimSpreadMs: SETTLE_CLAIM_SPREAD_MS,
        settleClaimHeadStartMs: SETTLE_CLAIM_HEAD_START_MS,
        highPriority,
        log: consoleLogger,
        onLost: forget,
      })
    : await acquireMachineLocalLock(key, acquireTimeoutMs);
  if (allowNested) holds[key] = hold;

  // Calls made while nested ones still run can join, e.g. a nested call locking the account
  // again. The hold stops taking them in the same step that finds none left.
  const forgetOnceNestedHoldsEnd = async (): Promise<void> => {
    if (hold.nested > 0) {
      await waitForNestedHolds(key, hold);
      return forgetOnceNestedHoldsEnd();
    }
    forget();
  };

  const end = async (settle: boolean) => {
    await forgetOnceNestedHoldsEnd();
    // A call that joined the hold and released it may have broadcast under it, so the hold keeps
    // its settle window.
    await (settle || hold.nestedBroadcast ? lease.release() : lease.abandon());
  };

  return { release: () => end(true), abandon: () => end(false) };
}

async function endAll(
  leases: readonly AbandonableLease[],
  end: (lease: AbandonableLease) => Promise<void>,
): Promise<void> {
  const results = await Promise.allSettled(leases.map(end));
  const failure = results.find(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );
  if (failure) throw failure.reason;
}

/**
 * Locks the on-chain accounts a broadcast mutates, or shared resources, across every CI machine
 * when E2E_EXCLUSIVE_LOCK_* points at an R2 bucket, otherwise, or when E2E_EXCLUSIVE_LOCK_MODE is
 * "local", across this machine only.
 * Calls made while an `allowNested` lock is held, e.g. a CLI token approval inside a spec, run
 * under it instead of waiting for it, and its release waits for them. Releasing a lease another
 * holder took over throws. Abandoning it instead, when nothing was broadcast under it, spares the
 * next holder the settle window.
 */
export function acquireExclusiveLock(
  targets: readonly LockTarget[],
  label: string,
  { allowNested = false }: ExclusiveLockOptions = {},
): Promise<AbandonableLease> {
  return lockTargets(targets, label, { allowNested, giveUpIfHeld: false });
}

/**
 * Same as {@link acquireExclusiveLock} without waiting: resolves to undefined when another
 * holder has one of the targets. Without E2E_EXCLUSIVE_LOCK_* it still waits for this machine.
 */
export async function tryAcquireExclusiveLock(
  targets: readonly LockTarget[],
  label: string,
  { allowNested = false }: ExclusiveLockOptions = {},
): Promise<AbandonableLease | undefined> {
  try {
    return await lockTargets(targets, label, { allowNested, giveUpIfHeld: true });
  } catch (error) {
    if (!(error instanceof Error) || error.name !== "ExclusiveLockBusyError") throw error;
    consoleLogger.info(error.message);
    return undefined;
  }
}

/** One at a time, in the same order everywhere, so two holders of several keys never deadlock. */
async function acquireInOrder(
  keys: readonly string[],
  label: string,
  options: KeyLockOptions,
  leases: AbandonableLease[],
): Promise<void> {
  const [key, ...rest] = keys;
  if (key === undefined) return;
  leases.push(await acquireKey(key, label, options));
  await acquireInOrder(rest, label, options, leases);
}

async function lockTargets(
  targets: readonly LockTarget[],
  label: string,
  options: Pick<KeyLockOptions, "allowNested" | "giveUpIfHeld">,
): Promise<AbandonableLease> {
  const keys = lockKeys(targets);
  const sharedResourceKeys = new Set(
    targets.filter(isSharedResource).map(({ lockKey }) => lockKey),
  );
  const startedAt = Date.now();
  const deadline = startedAt + EXCLUSIVE_LOCK_ACQUIRE_TIMEOUT_MS;
  const leases: AbandonableLease[] = [];
  try {
    await acquireInOrder(keys, label, { ...options, deadline, sharedResourceKeys }, leases);
  } catch (error) {
    await Promise.allSettled(leases.map(lease => lease.abandon()));
    throw error;
  } finally {
    Reflect.set(os, WAITED_MS, waitedMsSoFar() + Date.now() - startedAt);
  }

  let ending: Promise<void> | undefined;
  return {
    release: () => (ending ??= endAll(leases, lease => lease.release())),
    abandon: () => (ending ??= endAll(leases, lease => lease.abandon())),
  };
}

/**
 * Makes every exclusive lock on these targets in this process fail at once until released,
 * e.g. for the rest of a spec whose own lock could not be taken.
 */
export function refuseExclusiveLocks(targets: readonly LockTarget[], reason: string): Lease {
  const holds = liveHolds();
  const refusal: LiveHold = { nested: 0, refusedBecause: reason };
  const keys = lockKeys(targets);
  for (const key of keys) holds[key] = refusal;
  return {
    release: () => {
      for (const key of keys) {
        if (holds[key] === refusal) Reflect.deleteProperty(holds, key);
      }
      return Promise.resolve();
    },
  };
}

/**
 * Runs `fn` under the lock of `targets`. With `waitsForConfirmation`, `fn` only returns once its
 * transactions are confirmed, so on success the targets are handed back without the settle window.
 */
export async function runWithExclusiveLock<T>(
  targets: readonly LockTarget[],
  label: string,
  fn: () => Promise<T>,
  { waitsForConfirmation = false }: { readonly waitsForConfirmation?: boolean } = {},
): Promise<T> {
  const lease = await acquireExclusiveLock(targets, label);
  let confirmed = false;
  try {
    const result = await fn();
    confirmed = waitsForConfirmation;
    return result;
  } finally {
    await (confirmed ? lease.abandon() : lease.release());
  }
}
