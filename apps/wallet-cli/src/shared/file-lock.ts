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

const TOKEN_RE = /^(\d+):([0-9a-f]{16})$/;

/** A token must be the full `<pid>:<16-hex-char nonce>` shape this module itself writes (see
 * `withFileLock`'s `randomBytes(8).toString("hex")`) to be attributable to a live process at all —
 * anything else (missing, empty, or a non-hex/wrong-length trailer such as `<pid>:not-a-nonce`)
 * could otherwise coincidentally share a pid with some unrelated live process on the machine and be
 * wrongly treated as a real, live holder instead of abandoned. */
function parsePid(token: string | undefined): number | undefined {
  const match = token ? TOKEN_RE.exec(token) : null;
  if (!match) return undefined;
  const pid = Number(match[1]);
  return Number.isInteger(pid) && pid > 0 ? pid : undefined;
}

/** A lock file that names no live process is abandoned — its holder crashed or was killed without
 * releasing it. A missing/malformed token can't be attributed to a live process either way, so it
 * counts as abandoned too: a corrupt lock file must never wedge every future command forever. */
function isAbandoned(token: string | undefined): boolean {
  const pid = parsePid(token);
  return pid === undefined || !isHolderAlive(pid);
}

/** Tries to publish `token` at `lockPath` via a private per-attempt temp file (see the module doc
 * comment on `withFileLock`). Returns whether it was acquired; `false` means `lockPath` is already
 * held by someone else. Throws for anything else, including transient Windows contention — the
 * caller decides how to retry. */
function tryPublishLock(lockPath: string, tmpPath: string, token: string): boolean {
  writeFileSync(tmpPath, token, { flag: "wx" });
  try {
    linkSync(tmpPath, lockPath);
    return true;
  } catch (e) {
    if (errorCode(e) === "EEXIST") return false;
    throw e;
  } finally {
    try {
      unlinkSync(tmpPath);
    } catch {}
  }
}

const RESTORE_ATTEMPTS = 20;

function sleepSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** Puts a live holder's lock (captured by mistake in `reclaimAbandonedLock`) back at `lockPath`.
 * Only `EEXIST` means there is nothing to put back; transient Windows contention is retried, and any
 * other failure is surfaced as a non-retryable error — dropping a live lock silently would let a
 * second process into the critical section alongside its real holder. */
function restoreLiveLock(claimPath: string, lockPath: string): void {
  for (let attempt = 1; ; attempt++) {
    try {
      linkSync(claimPath, lockPath);
      return;
    } catch (e) {
      if (errorCode(e) === "EEXIST") return;
      if (!isTransientWindowsContention(e) || attempt >= RESTORE_ATTEMPTS) {
        throw new Error(
          `Could not restore another process's lock at ${lockPath} (it was left at ${claimPath}). ` +
            `Wait for other wallet-cli commands to finish, then rename it back or delete it.`,
          { cause: e },
        );
      }
      sleepSync(RETRY_INTERVAL_MS);
    }
  }
}

/**
 * `lockPath` currently holds a token judged abandoned — tries to clear it so the next acquire
 * attempt can succeed. Renaming it away is the atomic claim (only one racing stealer can rename a
 * given source path away; the others get `ENOENT`), but the rename alone can't tell a claimant it
 * captured the dead lock it judged versus a live one recreated in the gap between judging and
 * renaming — so this verifies the claimed file's token still matches the one judged dead, and puts
 * a mismatched (live) one straight back if not. Throws (including `ENOENT` and transient Windows
 * contention) for the caller to classify.
 */
function reclaimAbandonedLock(
  lockPath: string,
  judgedDeadToken: string | undefined,
  myToken: string,
): void {
  const claimPath = `${lockPath}.stale-${myToken.replace(":", "-")}`;
  renameSync(lockPath, claimPath);
  if (readToken(claimPath) !== judgedDeadToken) {
    // The file we renamed away wasn't the dead lock we judged — a fresh, live one was recreated
    // here between our check and the rename. Put it back for its real holder.
    restoreLiveLock(claimPath, lockPath);
  }
  try {
    unlinkSync(claimPath);
  } catch {}
}

type AttemptResult =
  | { kind: "acquired" }
  | { kind: "retry-now" }
  | { kind: "wait"; cause?: unknown };

/** One pass at acquiring the lock: publish it if free, reclaim it if abandoned, or report that the
 * caller should wait (either a live holder has it, or a transient Windows condition needs a beat). */
function attemptAcquire(lockPath: string, tmpPath: string, token: string): AttemptResult {
  try {
    if (tryPublishLock(lockPath, tmpPath, token)) return { kind: "acquired" };
  } catch (e) {
    if (isTransientWindowsContention(e)) return { kind: "wait", cause: e };
    throw e;
  }

  const current = readToken(lockPath);
  if (!isAbandoned(current)) return { kind: "wait" }; // a live holder — just wait our turn

  try {
    reclaimAbandonedLock(lockPath, current, token);
    return { kind: "retry-now" }; // lockPath is now free (or freshly held by its real owner)
  } catch (e) {
    if (isTransientWindowsContention(e)) return { kind: "wait", cause: e };
    if (errorCode(e) === "ENOENT") return { kind: "retry-now" }; // already claimed/released by another
    throw e;
  }
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
 *  - releasing only removes the file if it still holds THIS call's token, so a steal that already
 *    replaced it is never deleted out from under its new, legitimate holder.
 *
 * Known residual gap: reclaiming an abandoned lock (see `reclaimAbandonedLock`) is not fully atomic
 * against a third process — if that third process acquires `lockPath` fresh in the narrow window
 * while this process is verifying/restoring a mismatched claim, the restore can fail and the
 * original (live, still-running) holder's lock is dropped without a replacement, letting two
 * holders run concurrently for one window. This needs an abandoned lock, a second process racing to
 * claim it fresh, and a third racing into the few-millisecond gap created by the first process's
 * verification step, all at once — accepted as a known, extremely narrow residual risk rather than
 * a proper OS-level advisory lock, given how far out of proportion that would be to a single-user
 * local CLI tool's actual concurrency needs.
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
    const result = attemptAcquire(lockPath, tmpPath, token);
    if (result.kind === "acquired") break;
    if (result.kind === "retry-now") continue;
    if (Date.now() > deadline) {
      throw new Error(
        `Timed out waiting for a lock (${lockPath}) held by a live process — another wallet-cli ` +
          `command is running. Wait for it to finish, or delete the lock file if you're sure none ` +
          `is (a crashed holder whose pid was since reused would otherwise wedge every command).`,
        { cause: result.cause },
      );
    }
    await sleep(RETRY_INTERVAL_MS);
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
