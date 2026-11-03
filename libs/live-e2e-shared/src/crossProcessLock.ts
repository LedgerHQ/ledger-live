import { randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Cross-process mutex: an exclusive lock shared by every process on the machine.
 *
 * An in-memory mutex (a module-level promise chain, `async-mutex`, …) only
 * serializes within a single process — each OS process (e.g. a Playwright or
 * jest worker) imports its own copy with its own state. To serialize across
 * processes the lock state must live outside any heap, on a medium all
 * processes on the machine can see: the filesystem.
 *
 * The lock is a directory created with `fs.mkdir`, which is atomic and fails
 * with `EEXIST` if it already exists — exactly the compare-and-swap we need.
 * Whoever wins the `mkdir` holds the lock; others spin with a backoff. A
 * heartbeat keeps the lock's mtime fresh while the holder is alive, so a
 * slow-but-live holder (a long critical section) is never mistaken for a
 * crashed one; a holder that dies leaves a stale mtime and the lock is
 * reclaimed after {@link DEFAULT_STALE_MS}.
 *
 * Different keys are independent, so unrelated work runs in parallel.
 */

type CrossProcessLockOptions = {
  rootDir?: string;
  staleMs?: number;
  heartbeatMs?: number;
  acquireTimeoutMs?: number;
  backoffMs?: number;
};

export const DEFAULT_STALE_MS = 30_000;
const DEFAULT_HEARTBEAT_MS = 5_000;
const DEFAULT_ACQUIRE_TIMEOUT_MS = 600_000;
const DEFAULT_BACKOFF_MS = 200;

// Kept local so this cross-process primitive pulls in no package-level deps.
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

function isErrnoException(err: unknown): err is NodeJS.ErrnoException {
  return typeof err === "object" && err !== null && "code" in err;
}

function defaultRootDir(): string {
  return path.join(os.tmpdir(), "ll-e2e-locks");
}

function sanitize(key: string): string {
  // Collision-free, filesystem-safe encoding.
  return Buffer.from(key, "utf8").toString("base64url");
}

function lockDirFor(key: string, rootDir: string = defaultRootDir()): string {
  return path.join(rootDir, sanitize(key));
}

const settleFileFor = (lockDir: string) => `${lockDir}.settled-until`;

/** When the last release of the lock at `lockDir` stops keeping it closed, or 0 if none does. */
async function settledUntil(lockDir: string): Promise<number> {
  try {
    return Number(await fs.promises.readFile(settleFileFor(lockDir), "utf8")) || 0;
  } catch (err) {
    if (isErrnoException(err) && err.code === "ENOENT") return 0;
    throw err;
  }
}

/**
 * Moves a stale lock aside before removing it. Renaming is atomic, so of two waiters that saw it
 * stale only one moves it; a slower one that moves the fresh lock the first just took puts it back.
 */
async function removeStaleLock(lockDir: string, staleMs: number): Promise<void> {
  const movedDir = `${lockDir}.${randomUUID()}.stale`;
  await fs.promises.rename(lockDir, movedDir);
  const { mtimeMs } = await fs.promises.stat(movedDir);
  if (Date.now() - mtimeMs > staleMs) {
    await fs.promises.rm(movedDir, { recursive: true, force: true });
  } else {
    await fs.promises.rename(movedDir, lockDir);
  }
}

/** Removes the lock at `lockDir` if stale, else gives its holder `backoffMs` to release it. */
async function waitForLockDir(lockDir: string, staleMs: number, backoffMs: number): Promise<void> {
  const { mtimeMs } = await fs.promises.stat(lockDir);
  if (Date.now() - mtimeMs > staleMs) await removeStaleLock(lockDir, staleMs);
  else await delay(backoffMs);
}

/**
 * Releases a cross-process lock. Released with `settleMs`, the key stays closed that long: the
 * next holder takes it and waits out the rest before it returns.
 */
export type ReleaseCrossProcessLock = (settleMs?: number) => Promise<void>;

/** Holds `key` until the returned release function is called. */
export async function acquireCrossProcessLock(
  key: string,
  options: CrossProcessLockOptions = {},
): Promise<ReleaseCrossProcessLock> {
  const rootDir = options.rootDir ?? defaultRootDir();
  const staleMs = options.staleMs ?? DEFAULT_STALE_MS;
  const heartbeatMs = options.heartbeatMs ?? DEFAULT_HEARTBEAT_MS;
  const acquireTimeoutMs = options.acquireTimeoutMs ?? DEFAULT_ACQUIRE_TIMEOUT_MS;
  const backoffMs = options.backoffMs ?? DEFAULT_BACKOFF_MS;

  const lockDir = lockDirFor(key, rootDir);
  await fs.promises.mkdir(rootDir, { recursive: true });
  const start = Date.now();
  const timedOut = () =>
    new Error(
      `[crossProcessLock]: timed out after ${acquireTimeoutMs}ms acquiring lock for "${key}"`,
    );

  const takeLockDir = async (): Promise<void> => {
    try {
      await fs.promises.mkdir(lockDir); // non-recursive → throws EEXIST if held
      return;
    } catch (err) {
      if (!isErrnoException(err) || err.code !== "EEXIST") throw err;
    }
    if (Date.now() - start > acquireTimeoutMs) throw timedOut();
    await waitForLockDir(lockDir, staleMs, backoffMs).catch(() => {});
    return takeLockDir();
  };
  await takeLockDir();

  // Hold: refresh mtime so a live-but-slow holder is never seen as stale.
  const heartbeat = setInterval(() => {
    const now = new Date();
    fs.promises.utimes(lockDir, now, now).catch(() => {});
  }, heartbeatMs);
  heartbeat.unref();

  let released = false;
  const release: ReleaseCrossProcessLock = async (settleMs = 0) => {
    if (released) return;
    released = true;
    if (settleMs > 0) {
      const settleFileWritten = await fs.promises
        .writeFile(settleFileFor(lockDir), String(Date.now() + settleMs))
        .then(
          () => true,
          err => {
            console.warn(
              `[crossProcessLock]: failed to keep "${key}" closed after its release, so holding it ${settleMs}ms instead`,
              err,
            );
            return false;
          },
        );
      if (!settleFileWritten) {
        await delay(settleMs);
        // Whatever the failed write left there would fail the next holder's read.
        await fs.promises
          .rm(settleFileFor(lockDir), { recursive: true, force: true })
          .catch(err =>
            console.warn(`[crossProcessLock]: failed to clear "${key}"'s settle file`, err),
          );
      }
    }
    clearInterval(heartbeat);
    try {
      await fs.promises.rm(lockDir, { recursive: true, force: true });
    } catch (err) {
      console.warn(`[crossProcessLock]: failed to release lock for "${key}"`, err);
    }
  };

  // Held meanwhile, with its heartbeat, so the next waiters queue behind it.
  const waitOutSettle = async () => {
    const settleLeftMs = (await settledUntil(lockDir)) - Date.now();
    if (settleLeftMs <= 0) return;
    if (Date.now() - start + settleLeftMs > acquireTimeoutMs) throw timedOut();
    console.warn(
      `[crossProcessLock]: waiting ${settleLeftMs}ms for "${key}" to settle after its last release`,
    );
    await delay(settleLeftMs);
  };
  try {
    await waitOutSettle();
  } catch (err) {
    await release();
    throw err;
  }
  return release;
}
