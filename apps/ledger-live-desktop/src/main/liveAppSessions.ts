import { app, session } from "electron";
import { log } from "@ledgerhq/logs";
import * as fsPromises from "node:fs/promises";
import * as path from "node:path";
import { LIVE_APP_PARTITION, isLiveAppPartitionName } from "~/config/liveAppSession";

/**
 * Live Apps keep their data in their own partitions, so clearing the default
 * session no longer reaches it. Settings' "Clear cache" and "Reset" come here.
 */

// Covers a partition visited this run before anything was written to disk.
// Never pruned, which costs nothing: Electron keeps `persist:` sessions alive
// for the whole process anyway.
const attachedSessions = new Set<Electron.Session>();

export function trackLiveAppSession(guestSession: Electron.Session): void {
  if (guestSession !== session.defaultSession) attachedSessions.add(guestSession);
}

/**
 * An app not opened during this run has no `Session` object yet, so the on-disk
 * partitions are what make clearing cover every Live App and not just the
 * visited ones. Restricted to the names a Live App can produce: `fromPartition`
 * also *creates* the sessions it names, and any other feature's partition is
 * not ours to wipe.
 */
async function persistedLiveAppSessions(): Promise<Electron.Session[]> {
  try {
    const entries = await fsPromises.readdir(path.join(app.getPath("userData"), "Partitions"), {
      withFileTypes: true,
    });
    return entries
      .filter(entry => entry.isDirectory() && isLiveAppPartitionName(entry.name))
      .map(entry => session.fromPartition(`persist:${entry.name}`));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      log("live-app-session", `could not list persisted partitions: ${String(error)}`);
    }
    return [];
  }
}

async function forEachLiveAppSession(action: (s: Electron.Session) => Promise<void>) {
  // `fromPartition` hands back the live instance for a partition already in use.
  const sessions = [
    ...new Set([
      session.fromPartition(LIVE_APP_PARTITION),
      ...attachedSessions,
      ...(await persistedLiveAppSessions()),
    ]),
  ];

  // One partition failing must not leave the others intact.
  const results = await Promise.allSettled(sessions.map(action));
  const failed = results.filter(result => result.status === "rejected").length;
  if (failed) {
    log("live-app-session", `failed to clear ${failed}/${sessions.length} partition(s)`);
  }
}

export const clearLiveAppSessionsCache = () => forEachLiveAppSession(s => s.clearCache());

/** Cookies, localStorage and the rest: this is what drops third-party auth tokens. */
export const clearLiveAppSessionsStorage = () => forEachLiveAppSession(s => s.clearStorageData());
