import type { ChildProcess } from "node:child_process";
import {
  assertNoLiveListener,
  ErrorLineSchema,
  listenerPaths,
  readFirstLogJsonLine,
  readLogLinesBeforeFirstJson,
  selfCommand,
  spawnDetached,
  withStartLock,
  type ListenerKind,
} from "./detach";
import { CodedCommandError } from "../output";
import { writeStderr } from "../shared/ui";

export async function startDetachedListener(
  kind: ListenerKind,
  profileId: string,
  args: string[],
  precheck: () => Promise<void>,
): Promise<{ child: ChildProcess; first: Record<string, unknown> | undefined; logPath: string }> {
  const { logPath } = listenerPaths(kind, profileId);
  // The start lock keeps a concurrent --detach for this profile from passing the check, then
  // truncating and sharing the log, until this listener holds its own lock or has failed.
  const { child, first } = await withStartLock(kind, profileId, async () => {
    // Checked before the spawn truncates the log: a running listener still writes to it, and the
    // log is the only record of how the last detached run ended.
    assertNoLiveListener(kind, profileId);
    await precheck();
    const started = spawnDetached(selfCommand(args), logPath);
    try {
      return { child: started, first: await readFirstLogJsonLine(kind, started, logPath) };
    } finally {
      // The listener's stderr only reaches its log: relay what it wrote before its first line, or
      // all of it when it ended without one (e.g. the plaintext key warning that records the
      // human's consent), as a plain run shows it. Read under the start lock: a concurrent
      // --detach for this profile truncates the log after it.
      for (const line of readLogLinesBeforeFirstJson(logPath)) writeStderr(`${line}\n`);
    }
  });
  return { child, first, logPath };
}

export function throwListenerError(first: Record<string, unknown>): void {
  const failure = ErrorLineSchema.safeParse(first);
  if (!failure.success) return;
  const { code, message } = failure.data.error;
  throw code === undefined ? new Error(message) : new CodedCommandError(code, message);
}
