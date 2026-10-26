import { spawn, type ChildProcess } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, closeSync, fchmodSync, mkdirSync, openSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { stateDir } from "@bunli/utils";
import { z } from "zod";
import { DETACHED_LISTENER_ENV } from "../analytics/lifecycle-analytics";
import { AGENT_INTENT_KEY_STORES, APP_NAME } from "../session/session-store";
import { readLiveLockHolderPid, withFileLock } from "../shared/file-lock";

const LISTENER_DIR = "agent-intent-enroll";
const LOCK_ACQUIRE_TIMEOUT_MS = 1_000;
/** How long a `--detach` parent waits for the listener's first line. Past it the parent hands the
 * listener over to `wait` instead of stopping it: a keychain unlock prompt can hold it longer, and a
 * listener blocked in a keychain write only sees a stop signal once the write returns. */
export const STARTUP_TIMEOUT_MS = 30_000;
const STARTUP_POLL_MS = 100;
const START_LOCK_MARGIN_MS = 5_000;

/** File name stem of a profile's listener files: the id lowercased, plus a hash of the exact id.
 * Profile ids are case-sensitive, so `Bot` and `bot` must not share files on a case-insensitive
 * filesystem (macOS by default). Every stem ends in its hash, so no suffix makes one stem another. */
function fileStem(profileId: string): string {
  const hash = createHash("sha256").update(profileId).digest("hex").slice(0, 8);
  return `${profileId.toLowerCase()}-${hash}`;
}

/** Per-profile files of an `enroll` listener under the CLI state dir. Computed lazily so it follows
 * the current `stateDir()`, like the session paths. */
export function enrollListenerPaths(profileId: string): { logPath: string; lockPath: string } {
  const dir = join(stateDir(APP_NAME), LISTENER_DIR);
  const stem = fileStem(profileId);
  return { logPath: join(dir, `${stem}.log`), lockPath: join(dir, `${stem}.lock`) };
}

function ensureListenerDir(): void {
  const dir = join(stateDir(APP_NAME), LISTENER_DIR);
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  chmodSync(dir, 0o700);
}

/** Fails when a live listener already holds the profile's lock, pointing at `wait` instead. */
export function assertNoLiveEnrollListener(profileId: string): void {
  const runningPid = readLiveLockHolderPid(enrollListenerPaths(profileId).lockPath);
  if (runningPid !== undefined) {
    throw new Error(
      `An enrollment listener for profile "${profileId}" is already running (pid ${runningPid}). ` +
        `Run \`wallet-cli agent-intent wait --profile ${profileId}\` to check on it.`,
    );
  }
}

/** Runs `fn` as the profile's enrollment listener. A second listener for the same profile fails
 * at once instead of queueing behind the first. `wait` reads this lock to tell a running listener
 * from one that died. */
export async function withEnrollListenerLock<T>(
  profileId: string,
  fn: () => Promise<T>,
): Promise<T> {
  ensureListenerDir();
  assertNoLiveEnrollListener(profileId);
  return withFileLock(enrollListenerPaths(profileId).lockPath, fn, LOCK_ACQUIRE_TIMEOUT_MS);
}

/** Runs `fn` while holding the profile's `enroll --detach` start lock. A second start waits for the
 * first one's startup instead of racing it; the listener child never takes this lock. */
export async function withEnrollStartLock<T>(profileId: string, fn: () => Promise<T>): Promise<T> {
  ensureListenerDir();
  // Ends in neither `.lock` nor `.log`, so it is never a listener's lock or log.
  const lockPath = join(stateDir(APP_NAME), LISTENER_DIR, `${fileStem(profileId)}.lock.start`);
  return withFileLock(lockPath, fn, STARTUP_TIMEOUT_MS + START_LOCK_MARGIN_MS);
}

/** Command line that re-runs this CLI with `args`. The compiled binary is its own entry point (its
 * `argv[1]` is a virtual `/$bunfs/` path); in dev, `process.execPath` is `bun` and `argv[1]` the
 * script. */
export function selfCommand(args: readonly string[]): string[] {
  const script = process.argv[1];
  return script === undefined || script.startsWith("/$bunfs/")
    ? [process.execPath, ...args]
    : [process.execPath, script, ...args];
}

/** Starts `command` in its own session, detached from this process, with stdout and stderr in a
 * fresh 0600 log at `logPath`. The child never holds this process's stdio, so a caller reading our
 * output through a pipe is not kept waiting for it. Its env marks it as a detached listener, which
 * tags its analytics. */
export function spawnDetached(command: readonly string[], logPath: string): ChildProcess {
  ensureListenerDir();
  const logFd = openSync(logPath, "w", 0o600);
  try {
    fchmodSync(logFd, 0o600); // `mode` only applies on create; a reused log keeps its old one
    const [file, ...args] = command;
    const child = spawn(file, args, {
      detached: true,
      stdio: ["ignore", logFd, logFd],
      env: { ...process.env, [DETACHED_LISTENER_ENV]: "1" },
    });
    child.unref();
    return child;
  } finally {
    closeSync(logFd);
  }
}

/** Every complete line of the log. A missing log reads as empty. */
function readLogLines(logPath: string): string[] {
  let content: string;
  try {
    content = readFileSync(logPath, "utf8");
  } catch {
    return [];
  }
  return content.split("\n").slice(0, -1); // the last item is a partial line, or ""
}

/** `line` as a JSON object, or undefined if it is not one. */
function parseJsonObject(line: string): Record<string, unknown> | undefined {
  try {
    const value: unknown = JSON.parse(line);
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
  } catch {}
  return undefined;
}

/** Every complete line of the log that parses as a JSON object, in order. Other lines (stderr
 * banners, a crash trace) are skipped. A missing log reads as empty. */
export function readLogJsonLines(logPath: string): Record<string, unknown>[] {
  const objects: Record<string, unknown>[] = [];
  for (const line of readLogLines(logPath)) {
    const object = parseJsonObject(line);
    if (object) objects.push(object);
  }
  return objects;
}

/** The complete lines the listener logged before its first JSON object line: what it wrote to
 * stderr (warnings, notices) before its first event. */
export function readLogLinesBeforeFirstJson(logPath: string): string[] {
  const lines: string[] = [];
  for (const line of readLogLines(logPath)) {
    if (parseJsonObject(line)) break;
    lines.push(line);
  }
  return lines;
}

/** The listener's `enrollment-pending` line, as `enroll --output json` prints it. */
export const PendingLineSchema = z.object({
  type: z.literal("enrollment-pending"),
  profileId: z.string(),
  enrollmentUrl: z.string(),
  fingerprint: z.string(),
  expiresAt: z.string(),
  keyStore: z.enum(AGENT_INTENT_KEY_STORES),
});

/** A JSON error envelope, as any command prints it with `--output json`. */
export const ErrorLineSchema = z.object({
  ok: z.literal(false),
  error: z.object({ code: z.string().optional(), message: z.string() }),
});

/** Waits for the child's first NDJSON line in its log. Fails if the child exits (or cannot start)
 * without printing one; returns undefined, leaving the child running, if it prints nothing within
 * the startup timeout. */
export async function readFirstLogJsonLine(
  child: ChildProcess,
  logPath: string,
  timeoutMs = STARTUP_TIMEOUT_MS,
): Promise<Record<string, unknown> | undefined> {
  let exited: string | undefined;
  const onExit = (code: number | null, signal: NodeJS.Signals | null) => {
    exited = signal ? `was killed by ${signal}` : `exited with code ${code}`;
  };
  const onError = (e: Error) => {
    exited = `could not start (${e.message})`;
  };
  child.once("exit", onExit);
  child.once("error", onError);
  try {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      // Captured before reading, so a line written right before the exit is still picked up.
      const exitedBeforeRead = exited;
      const [first] = readLogJsonLines(logPath);
      if (first) return first;
      if (exitedBeforeRead) {
        throw new Error(
          `The enrollment listener ${exitedBeforeRead} before printing its first event. See ${logPath}.`,
        );
      }
      if (Date.now() >= deadline) return undefined;
      await sleep(STARTUP_POLL_MS);
    }
  } finally {
    child.off("exit", onExit);
    child.off("error", onError);
  }
}
