/**
 * Each worker process records the Speculos instances it started in its own file, so workers never
 * write the same file. A file whose owner process is gone is an orphan, and its instances are
 * released by `releaseOrphanedSpeculos`.
 */

import { execFile } from "node:child_process";
import { readdir, readFile, unlink, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import logger from "@wdio/logger";
import { releaseSpeculosDeviceCI } from "@ledgerhq/live-e2e-shared/speculosCI";
import { sanitizeError } from "@ledgerhq/live-e2e-shared/index";

const execFileAsync = promisify(execFile);

const ARTIFACTS_DIR = path.resolve("artifacts");
const INSTANCE_FILE_PREFIX = "speculos-instances.";
const INSTANCE_FILE_SUFFIX = ".json";

const trackingLogger = logger("Speculos tracking");

/** The PID in a tracking file name, or `undefined` for any other file. */
function ownerPidOf(fileName: string): number | undefined {
  if (!fileName.startsWith(INSTANCE_FILE_PREFIX) || !fileName.endsWith(INSTANCE_FILE_SUFFIX))
    return undefined;
  const pid = fileName.slice(INSTANCE_FILE_PREFIX.length, -INSTANCE_FILE_SUFFIX.length);
  return /^\d+$/.test(pid) ? Number(pid) : undefined;
}

export type SpeculosId = { deviceId: string };

const ownTrackingFile = path.join(
  ARTIFACTS_DIR,
  `${INSTANCE_FILE_PREFIX}${process.pid}${INSTANCE_FILE_SUFFIX}`,
);

// Updates from this process run one at a time, so read-modify-write never interleaves.
let trackingQueue: Promise<void> = Promise.resolve();

/** `null` when the file is missing or malformed, so a caller never mistakes it for an empty list. */
async function readInstances(filePath: string): Promise<SpeculosId[] | null> {
  try {
    return JSON.parse(await readFile(filePath, "utf-8"));
  } catch {
    return null;
  }
}

async function writeInstances(filePath: string, instances: SpeculosId[]): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(instances, null, 2));
}

function updateOwnTrackingFile(update: (instances: SpeculosId[]) => SpeculosId[]): Promise<void> {
  const run = trackingQueue.then(async () =>
    writeInstances(ownTrackingFile, update((await readInstances(ownTrackingFile)) ?? [])),
  );
  trackingQueue = run.catch(() => {});
  return run;
}

/** Records a started instance. Never rejects: a failed write is logged, not fatal to the test. */
export async function trackSpeculos(deviceId: string): Promise<void> {
  try {
    await updateOwnTrackingFile(instances => [...instances, { deviceId }]);
  } catch (error) {
    trackingLogger.warn(`Failed to register Speculos instance ${deviceId}:`, sanitizeError(error));
  }
}

/** Forgets an instance once it has been stopped. Never rejects, like `trackSpeculos`. */
export async function untrackSpeculos(deviceId: string): Promise<void> {
  try {
    await updateOwnTrackingFile(instances => instances.filter(inst => inst.deviceId !== deviceId));
  } catch (error) {
    trackingLogger.warn(
      `Failed to unregister Speculos instance ${deviceId}:`,
      sanitizeError(error),
    );
  }
}

/**
 * Releases an instance from any process. Local instances are Docker containers named after the
 * device id. Their transport only lives in the process that created them, so `stopSpeculos` would
 * report success here without stopping anything.
 */
async function releaseSpeculos(deviceId: string): Promise<void> {
  if (process.env.REMOTE_SPECULOS === "true") {
    const released = await releaseSpeculosDeviceCI(deviceId);
    if (!released) throw new Error("Speculinho did not confirm the release");
    return;
  }
  try {
    await execFileAsync("docker", ["rm", "-f", deviceId]);
  } catch (error) {
    // Docker says the container is gone, so there is nothing left to release.
    const stderr = error instanceof Error && "stderr" in error ? String(error.stderr) : "";
    if (!/No such container/.test(stderr)) throw error;
  }
}

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM means the process exists but belongs to another user, so it is still alive.
    return error instanceof Error && "code" in error && error.code === "EPERM";
  }
}

/**
 * Stops the Speculos instances recorded by dead workers, and deletes their tracking file once every
 * instance is stopped. Files of live processes are left alone, so concurrent runs on the same
 * machine do not release each other's devices.
 */
export async function releaseOrphanedSpeculos(): Promise<void> {
  try {
    const files = await readdir(ARTIFACTS_DIR).catch((): string[] => []);
    const orphanFiles = files.flatMap(file => {
      const ownerPid = ownerPidOf(file);
      if (ownerPid === undefined || isAlive(ownerPid)) return [];
      return [path.join(ARTIFACTS_DIR, file)];
    });

    await Promise.all(orphanFiles.map(releaseOrphanFile));
  } catch (error) {
    trackingLogger.error("Speculos cleanup failed:", sanitizeError(error));
  }
}

async function releaseOrphanFile(filePath: string): Promise<void> {
  const instances = await readInstances(filePath);
  if (instances === null) {
    trackingLogger.error(`Malformed Speculos tracking file ${filePath}. Keeping it for recovery`);
    return;
  }

  const results = await Promise.allSettled(
    instances.map(({ deviceId }) => releaseSpeculos(deviceId)),
  );
  const failed = results.flatMap((result, i) =>
    result.status === "rejected"
      ? [`${instances[i].deviceId} (${sanitizeError(result.reason)})`]
      : [],
  );

  if (instances.length) {
    trackingLogger.info(
      `Released ${instances.length - failed.length}/${instances.length} orphan Speculos instance(s) from ${path.basename(filePath)}`,
    );
  }
  if (failed.length) {
    trackingLogger.error(`Could not release Speculos: ${failed.join(", ")}. Keeping ${filePath}`);
    return;
  }
  await unlink(filePath).catch(() => {});
}
