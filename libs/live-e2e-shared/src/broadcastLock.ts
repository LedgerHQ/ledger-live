import { randomUUID } from "node:crypto";
import os from "node:os";
import { byCodeUnit } from "./broadcastLock/byCodeUnit";
import { acquireDistributedLock } from "./broadcastLock/distributedLock";
import { BroadcastLockRefusedError } from "./errors";
import { createR2LockStore } from "./broadcastLock/r2LockStore";
import { runWithCrossProcessLock } from "./crossProcessLock";
import type { AbandonableLease, Lease, LockLogger, LockStore } from "./broadcastLock/types";
import type { Account } from "./enum/Account";

export type { Lease } from "./broadcastLock/types";

export const BROADCAST_LOCK_ACQUIRE_TIMEOUT_MS = 30 * 60_000;
export const BROADCAST_LOCK_NESTED_DRAIN_MS = 60_000;
const LEASE_MS = 120_000;
const HEARTBEAT_MS = 20_000;
const POLL_MS = 5_000;
// How long a lock attempt that must not wait keeps retrying lock store errors.
const TRY_LOCK_STORE_RETRY_MS = 30_000;
// Long enough for the last transaction to reach the nodes the next holder reads its nonce from.
const SETTLE_MS = 45_000;
const R2_KEY_PREFIX = "e2e-broadcast-locks/";
const HOLDER_PREFIX = `${os.hostname()}:${process.pid}:`;
const LIVE_HOLDS = Symbol.for("@ledgerhq/live-e2e-shared/broadcastLock/liveHolds");
const WAITED_MS = Symbol.for("@ledgerhq/live-e2e-shared/broadcastLock/waitedMs");

// Detox runs on CI at --loglevel warn, which drops console.info.
const consoleLogger: LockLogger = {
  info: message => console.warn(message),
  warn: message => console.warn(message),
};

type LiveHold = { nested: number; onNestedDone?: () => void; refusedBecause?: string };
type LiveHolds = Record<string, LiveHold>;

export type AccountBroadcastLockOptions = { readonly allowNested?: boolean };

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

/** Off-chain state that tests on several machines change, locked like an on-chain account. */
export type SharedResource = { readonly lockKey: string };

/** The card of the Baanx sandbox user every Pay tab suite signs in as, which freeze tests toggle. */
export const PAY_CARD: SharedResource = { lockKey: "pay-card" };

export type LockTarget = Account | SharedResource;

const lockKeyOf = (target: LockTarget) =>
  "lockKey" in target ? target.lockKey : accountLockKey(target);

const waitedMsSoFar = (): number => {
  const waited: unknown = Reflect.get(os, WAITED_MS);
  return typeof waited === "number" ? waited : 0;
};

/**
 * Time this process spent acquiring broadcast locks since the last call. Kept on node:os, like the
 * live holds, so jest.environment.ts can read what the spec file's module copies waited.
 */
export function takeBroadcastLockWaitedMs(): number {
  const waited = waitedMsSoFar();
  Reflect.set(os, WAITED_MS, 0);
  return waited;
}

function remoteLockStoreFromEnv(): LockStore | undefined {
  const endpoint = process.env.E2E_BROADCAST_LOCK_ENDPOINT;
  const bucket = process.env.E2E_BROADCAST_LOCK_BUCKET;
  const accessKeyId = process.env.E2E_BROADCAST_LOCK_ACCESS_KEY_ID;
  const secretAccessKey = process.env.E2E_BROADCAST_LOCK_SECRET_ACCESS_KEY;
  if (!endpoint && !bucket && !accessKeyId && !secretAccessKey) return undefined;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "[broadcastLock] E2E_BROADCAST_LOCK_ENDPOINT, _BUCKET, _ACCESS_KEY_ID and _SECRET_ACCESS_KEY must be set together",
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

function acquireMachineLocalLock(key: string, acquireTimeoutMs: number): Promise<AbandonableLease> {
  if (!warnedMachineLocal) {
    warnedMachineLocal = true;
    console.warn(
      "[broadcastLock] E2E_BROADCAST_LOCK_* is not set: broadcasts are only serialized between processes on this machine",
    );
  }
  return new Promise<AbandonableLease>((resolve, reject) => {
    let endHold = () => {};
    const holding = new Promise<void>(resolveHolding => {
      endHold = resolveHolding;
    });
    const settled = runWithCrossProcessLock(
      key,
      async () => {
        const release = async () => {
          endHold();
          await settled;
        };
        resolve({ release, abandon: release });
        await holding;
      },
      { acquireTimeoutMs },
    );
    settled.catch(reject);
  });
}

function joinHold(outer: LiveHold): AbandonableLease {
  outer.nested++;
  let left = false;
  const leave = () => {
    if (!left) {
      left = true;
      outer.nested--;
      if (outer.nested === 0) outer.onNestedDone?.();
    }
    return Promise.resolve();
  };
  return { release: leave, abandon: leave };
}

async function waitForNestedHolds(key: string, hold: LiveHold): Promise<void> {
  if (hold.nested === 0) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const allNestedDone = await Promise.race([
    new Promise<boolean>(resolve => {
      hold.onNestedDone = () => resolve(true);
    }),
    new Promise<boolean>(resolve => {
      timer = setTimeout(() => resolve(false), BROADCAST_LOCK_NESTED_DRAIN_MS);
    }),
  ]);
  clearTimeout(timer);
  if (!allNestedDone) {
    console.warn(
      `[broadcastLock] releasing "${key}" while a broadcast nested in it still runs after ${BROADCAST_LOCK_NESTED_DRAIN_MS}ms`,
    );
  }
}

type KeyLockOptions = {
  readonly allowNested: boolean;
  readonly deadline: number;
  readonly giveUpIfHeld: boolean;
};

async function acquireKey(
  key: string,
  label: string,
  { allowNested, deadline, giveUpIfHeld }: KeyLockOptions,
): Promise<AbandonableLease> {
  const holds = liveHolds();
  const outer = holds[key];
  if (outer?.refusedBecause && !allowNested) {
    throw new BroadcastLockRefusedError(`[broadcastLock] "${key}" ${outer.refusedBecause}`);
  }
  if (outer && !allowNested) return joinHold(outer);

  const hold: LiveHold = { nested: 0 };
  const forget = () => {
    if (holds[key] === hold) Reflect.deleteProperty(holds, key);
  };
  const acquireTimeoutMs = Math.max(0, deadline - Date.now());
  const store = remoteLockStoreFromEnv();
  const lease = store
    ? await acquireDistributedLock(store, key, {
        holder: `${HOLDER_PREFIX}${randomUUID()}`,
        label,
        leaseMs: LEASE_MS,
        settleMs: SETTLE_MS,
        heartbeatMs: HEARTBEAT_MS,
        pollMs: POLL_MS,
        acquireTimeoutMs: giveUpIfHeld
          ? Math.min(TRY_LOCK_STORE_RETRY_MS, acquireTimeoutMs)
          : acquireTimeoutMs,
        giveUpWhenHeld: giveUpIfHeld,
        log: consoleLogger,
        onLost: forget,
      })
    : await acquireMachineLocalLock(key, acquireTimeoutMs);
  if (allowNested) holds[key] = hold;

  return {
    release: async () => {
      forget();
      await waitForNestedHolds(key, hold);
      await lease.release();
    },
    abandon: async () => {
      forget();
      await lease.abandon();
    },
  };
}

async function releaseAll(leases: readonly Lease[]): Promise<void> {
  const results = await Promise.allSettled(leases.map(lease => lease.release()));
  const failure = results.find(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );
  if (failure) throw failure.reason;
}

/**
 * Locks the on-chain accounts a broadcast mutates, or shared resources, across every CI machine
 * when E2E_BROADCAST_LOCK_* points at an R2 bucket, otherwise across this machine only.
 * Calls made while an `allowNested` lock is held, e.g. a CLI token approval inside a spec, run
 * under it instead of waiting for it, and its release waits for them. Releasing a lease another
 * holder took over throws.
 */
export function acquireAccountBroadcastLock(
  targets: readonly LockTarget[],
  label: string,
  { allowNested = false }: AccountBroadcastLockOptions = {},
): Promise<Lease> {
  return lockTargets(targets, label, { allowNested, giveUpIfHeld: false });
}

/**
 * Same as {@link acquireAccountBroadcastLock} without waiting: resolves to undefined when another
 * holder has one of the targets. Without E2E_BROADCAST_LOCK_* it still waits for this machine.
 */
export async function tryAcquireAccountBroadcastLock(
  targets: readonly LockTarget[],
  label: string,
  { allowNested = false }: AccountBroadcastLockOptions = {},
): Promise<Lease | undefined> {
  try {
    return await lockTargets(targets, label, { allowNested, giveUpIfHeld: true });
  } catch (error) {
    if (!(error instanceof Error) || error.name !== "BroadcastLockBusyError") throw error;
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
  options: Omit<KeyLockOptions, "deadline">,
): Promise<Lease> {
  const keys = [...new Set(targets.map(lockKeyOf))].sort(byCodeUnit);
  const startedAt = Date.now();
  const deadline = startedAt + BROADCAST_LOCK_ACQUIRE_TIMEOUT_MS;
  const leases: AbandonableLease[] = [];
  try {
    await acquireInOrder(keys, label, { ...options, deadline }, leases);
  } catch (error) {
    await Promise.allSettled(leases.map(lease => lease.abandon()));
    throw error;
  } finally {
    Reflect.set(os, WAITED_MS, waitedMsSoFar() + Date.now() - startedAt);
  }

  let releasing: Promise<void> | undefined;
  return { release: () => (releasing ??= releaseAll(leases)) };
}

/**
 * Makes every broadcast lock on these targets in this process fail at once until released,
 * e.g. for the rest of a spec whose own lock could not be taken.
 */
export function refuseAccountBroadcastLocks(targets: readonly LockTarget[], reason: string): Lease {
  const holds = liveHolds();
  const refusal: LiveHold = { nested: 0, refusedBecause: reason };
  const keys = [...new Set(targets.map(lockKeyOf))];
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

export async function runWithAccountBroadcastLock<T>(
  targets: readonly LockTarget[],
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  const lease = await acquireAccountBroadcastLock(targets, label);
  try {
    return await fn();
  } finally {
    await lease.release();
  }
}
