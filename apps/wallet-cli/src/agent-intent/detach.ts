import { spawn, type ChildProcess } from "node:child_process";
import { chmodSync, closeSync, fchmodSync, mkdirSync, openSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { stateDir } from "@bunli/utils";
import { APP_NAME } from "../session/session-store";
import { withFileLock } from "../shared/file-lock";

const LISTENER_DIR = "agent-intent-enroll";
const LOCK_ACQUIRE_TIMEOUT_MS = 1_000;
const STARTUP_TIMEOUT_MS = 30_000;
const STARTUP_POLL_MS = 100;

/** Per-profile files of an `enroll` listener under the CLI state dir. Computed lazily so it follows
 * the current `stateDir()`, like the session paths. */
export function enrollListenerPaths(profileId: string): { logPath: string; lockPath: string } {
  const dir = join(stateDir(APP_NAME), LISTENER_DIR);
  return { logPath: join(dir, `${profileId}.log`), lockPath: join(dir, `${profileId}.lock`) };
}

function ensureListenerDir(): void {
  const dir = join(stateDir(APP_NAME), LISTENER_DIR);
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  chmodSync(dir, 0o700);
}

/** Runs `fn` as the profile's enrollment listener. A second listener for the same profile fails
 * fast instead of queueing behind the first. `wait` reads this lock to tell a running listener from
 * one that died. */
export async function withEnrollListenerLock<T>(
  profileId: string,
  fn: () => Promise<T>,
): Promise<T> {
  ensureListenerDir();
  return withFileLock(enrollListenerPaths(profileId).lockPath, fn, LOCK_ACQUIRE_TIMEOUT_MS);
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
 * output through a pipe is not kept waiting for it. */
export function spawnDetached(command: readonly string[], logPath: string): ChildProcess {
  ensureListenerDir();
  const logFd = openSync(logPath, "w", 0o600);
  try {
    fchmodSync(logFd, 0o600); // `mode` only applies on create; a reused log keeps its old one
    const [file, ...args] = command;
    const child = spawn(file, args, { detached: true, stdio: ["ignore", logFd, logFd] });
    child.unref();
    return child;
  } finally {
    closeSync(logFd);
  }
}

/** Every complete line of the log that parses as a JSON object, in order. Other lines (stderr
 * banners, a crash trace) are skipped. A missing log reads as empty. */
export function readLogJsonLines(logPath: string): Record<string, unknown>[] {
  let content: string;
  try {
    content = readFileSync(logPath, "utf8");
  } catch {
    return [];
  }
  const lines = content.split("\n").slice(0, -1); // the last item is a partial line, or ""
  const objects: Record<string, unknown>[] = [];
  for (const line of lines) {
    try {
      const value: unknown = JSON.parse(line);
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        objects.push(value as Record<string, unknown>);
      }
    } catch {}
  }
  return objects;
}

/** Waits for the child's first NDJSON line in its log. Fails if the child exits (or cannot start)
 * without printing one, and kills it if it prints nothing within the startup timeout. */
export async function readFirstLogJsonLine(
  child: ChildProcess,
  logPath: string,
  timeoutMs = STARTUP_TIMEOUT_MS,
): Promise<Record<string, unknown>> {
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
          `The enrollment listener ${exitedBeforeRead} before printing anything. See ${logPath}.`,
        );
      }
      if (Date.now() >= deadline) {
        child.kill();
        throw new Error(
          `The enrollment listener printed nothing within ${timeoutMs / 1000}s and was stopped. ` +
            `See ${logPath}.`,
        );
      }
      await sleep(STARTUP_POLL_MS);
    }
  } finally {
    child.off("exit", onExit);
    child.off("error", onError);
  }
}
