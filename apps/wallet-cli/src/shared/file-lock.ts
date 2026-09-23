import { linkSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const DEFAULT_ACQUIRE_TIMEOUT_MS = 10_000;
const RETRY_INTERVAL_MS = 50;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function errorCode(e: unknown): string | undefined {
  return e instanceof Error && "code" in e && typeof e.code === "string" ? e.code : undefined;
}

/** Windows throws these (not EEXIST/ENOENT) for an operation on a file another process has open or
 * has pending-deleted — transient contention, not a real failure, so the caller should retry. */
function isTransientWindowsContention(e: unknown): boolean {
  const code = errorCode(e);
  return code === "EPERM" || code === "EBUSY";
}

/** Whether a process with this pid is still alive. Any error other than "no such process" (e.g. a
 * live process we lack permission to signal) must NOT read as dead, or a live lock gets stolen. */
function isHolderAlive(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return errorCode(e) !== "ESRCH";
  }
}

function readToken(lockPath: string): string | undefined {
  try {
    return readFileSync(lockPath, "utf8");
  } catch {
    return undefined;
  }
}

/** A lock file that names no live process is abandoned — its holder crashed or was killed without
 * releasing it. A missing/malformed token can't be attributed to a live process either way, so it
 * counts as abandoned too: a corrupt lock file must never wedge every future command forever. */
function isAbandoned(token: string | undefined): boolean {
  const pid = Number(token?.split(":")[0]);
  return !isHolderAlive(pid);
}

/**
 * Serializes access to a resource across wallet-cli processes via an exclusive lock file at
 * `lockPath`. The lock file's content is `<pid>:<nonce>` — this process's own token — so:
 *  - staleness is judged by whether that pid is still alive, not by the lock's age, so `fn` can run
 *    as long as it needs to without a live holder ever being mistaken for dead;
 *  - the lock is never observable half-written: the token is written to a private per-attempt temp
 *    file first, and `linkSync(tmp, lockPath)` publishes it — a hard link either creates `lockPath`
 *    with its content already in place or fails with `EEXIST`, unlike create-then-write, which
 *    leaves an empty, token-less file visible for a window a waiter can misread as abandoned;
 *  - stealing an abandoned lock is `renameSync` (only one racing claimant can rename a given source
 *    path away) **plus** a content check on the claimed file: the rename alone can't tell a claimant
 *    it captured the dead lock it judged versus a live one recreated in the gap between judging and
 *    renaming, so this checks the claimed file's token still matches the one judged dead, and puts a
 *    mismatched (live) one straight back if not;
 *  - releasing only removes the file if it still holds THIS call's token, so a steal that already
 *    replaced it is never deleted out from under its new, legitimate holder.
 */
export async function withFileLock<T>(
  lockPath: string,
  fn: () => Promise<T> | T,
  acquireTimeoutMs = DEFAULT_ACQUIRE_TIMEOUT_MS,
): Promise<T> {
  const token = `${process.pid}:${randomBytes(8).toString("hex")}`;
  const tmpPath = `${lockPath}.tmp-${token.replace(":", "-")}`;
  const deadline = Date.now() + acquireTimeoutMs;
  for (;;) {
    try {
      writeFileSync(tmpPath, token, { flag: "wx" });
      try {
        linkSync(tmpPath, lockPath);
        break; // acquired
      } finally {
        try {
          unlinkSync(tmpPath);
        } catch {}
      }
    } catch (e) {
      if (isTransientWindowsContention(e)) {
        await sleep(RETRY_INTERVAL_MS);
        continue;
      }
      if (errorCode(e) !== "EEXIST") throw e;
      const current = readToken(lockPath);
      if (isAbandoned(current)) {
        const claimPath = `${lockPath}.stale-${token.replace(":", "-")}`;
        try {
          renameSync(lockPath, claimPath); // atomic claim: only one racing stealer can win this
        } catch (renameError) {
          if (isTransientWindowsContention(renameError)) {
            await sleep(RETRY_INTERVAL_MS);
            continue;
          }
          if (errorCode(renameError) !== "ENOENT") throw renameError;
          // Someone else already claimed or released it first — loop back and try acquiring fresh.
          continue;
        }
        if (readToken(claimPath) !== current) {
          // The file we renamed away wasn't the dead lock we judged — a fresh, live one was
          // recreated here between our check and the rename. Put it back for its real holder.
          try {
            linkSync(claimPath, lockPath);
          } catch {
            // Someone else's fresh lock already occupies `lockPath` again — nothing to put back.
          }
        }
        try {
          unlinkSync(claimPath);
        } catch {}
        continue;
      }
      if (Date.now() > deadline) {
        throw new Error(
          `Timed out waiting for a lock (${lockPath}) held by a live process — another wallet-cli ` +
            `command is running. Wait for it to finish, or delete the lock file if you're sure none ` +
            `is (a crashed holder whose pid was since reused would otherwise wedge every command).`,
          { cause: e },
        );
      }
      await sleep(RETRY_INTERVAL_MS);
    }
  }
  try {
    return await fn();
  } finally {
    if (readToken(lockPath) === token) {
      try {
        unlinkSync(lockPath);
      } catch {}
    }
  }
}
