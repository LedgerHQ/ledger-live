import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Cross-process mutex: run a critical section while holding an exclusive lock
 * shared by every process on the machine.
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

export type CrossProcessLockOptions = {
  rootDir?: string;
  staleMs?: number;
  heartbeatMs?: number;
  acquireTimeoutMs?: number;
  backoffMs?: number;
};

export const DEFAULT_STALE_MS = 30_000;
export const DEFAULT_HEARTBEAT_MS = 5_000;
export const DEFAULT_ACQUIRE_TIMEOUT_MS = 600_000;
export const DEFAULT_BACKOFF_MS = 200;

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

export function lockDirFor(key: string, rootDir: string = defaultRootDir()): string {
  return path.join(rootDir, sanitize(key));
}

export async function runWithCrossProcessLock<T>(
  key: string,
  fn: () => Promise<T>,
  options: CrossProcessLockOptions = {},
): Promise<T> {
  const rootDir = options.rootDir ?? defaultRootDir();
  const staleMs = options.staleMs ?? DEFAULT_STALE_MS;
  const heartbeatMs = options.heartbeatMs ?? DEFAULT_HEARTBEAT_MS;
  const acquireTimeoutMs = options.acquireTimeoutMs ?? DEFAULT_ACQUIRE_TIMEOUT_MS;
  const backoffMs = options.backoffMs ?? DEFAULT_BACKOFF_MS;

  const lockDir = lockDirFor(key, rootDir);
  await fs.promises.mkdir(rootDir, { recursive: true });
  const start = Date.now();

  for (;;) {
    try {
      await fs.promises.mkdir(lockDir); // non-recursive → throws EEXIST if held
      break;
    } catch (err) {
      if (!isErrnoException(err) || err.code !== "EEXIST") throw err;

      if (Date.now() - start > acquireTimeoutMs) {
        throw new Error(
          `[runWithCrossProcessLock]: timed out after ${acquireTimeoutMs}ms acquiring lock for "${key}"`,
        );
      }

      try {
        const { mtimeMs } = await fs.promises.stat(lockDir);
        if (Date.now() - mtimeMs > staleMs) {
          await fs.promises.rm(lockDir, { recursive: true, force: true });
          continue;
        }
      } catch {
        continue;
      }
      await delay(backoffMs);
    }
  }

  // Hold: refresh mtime so a live-but-slow holder is never seen as stale.
  const heartbeat = setInterval(() => {
    const now = new Date();
    fs.promises.utimes(lockDir, now, now).catch(() => {});
  }, heartbeatMs);

  try {
    return await fn();
  } finally {
    clearInterval(heartbeat);
    try {
      await fs.promises.rm(lockDir, { recursive: true, force: true });
    } catch (err) {
      console.warn(`[runWithCrossProcessLock]: failed to release lock for "${key}"`, err);
    }
  }
}
