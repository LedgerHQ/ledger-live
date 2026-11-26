import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";

/** The session a Device Intent job runs on: the executor opened the currency app on it. */
export type DeviceSession = { readonly dmk: DeviceManagementKit; readonly sessionId: string };

const sessionTails = new WeakMap<DeviceManagementKit, Map<string, Promise<void>>>();

/** Runs `task` once the session's previous device job settled, across scans and completions: the call of a stopped one may still run when the next starts. */
export function onSession<T>(
  { dmk, sessionId }: DeviceSession,
  task: () => Promise<T>,
): Promise<T> {
  const tails = sessionTails.get(dmk) ?? new Map<string, Promise<void>>();
  sessionTails.set(dmk, tails);
  const result = (tails.get(sessionId) ?? Promise.resolve()).then(task);
  const tail = result.then(
    () => undefined,
    () => undefined,
  );
  tails.set(sessionId, tail);
  void tail.then(() => {
    if (tails.get(sessionId) === tail) tails.delete(sessionId);
  });
  return result;
}
