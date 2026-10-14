import { log } from "detox";
import { execFile } from "node:child_process";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { promisify } from "node:util";
import { releaseSpeculosDeviceCI } from "@ledgerhq/live-e2e-shared/speculosCI";
import { sanitizeError } from "@ledgerhq/live-e2e-shared/index";
import { isSpeculosRemote } from "@e2e/helpers/commonHelpers";
import { ARTIFACTS_DIR, SPECULOS_TRACKING_FILE_PATTERN } from "@e2e/utils/speculosUtils";

const execFileAsync = promisify(execFile);

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    const existsButNotOurs = error instanceof Error && "code" in error && error.code === "EPERM";
    return existsButNotOurs;
  }
}

async function releaseSpeculos(deviceId: string): Promise<void> {
  if (isSpeculosRemote()) {
    const released = await releaseSpeculosDeviceCI(deviceId);
    if (!released) throw new Error("Speculinho did not confirm the release");
  } else {
    const containerName = deviceId;
    await execFileAsync("docker", ["rm", "-f", containerName]);
  }
}

async function releaseTrackingFile(fullPath: string, ownerPid: string): Promise<void> {
  const content = await fs.readFile(fullPath, "utf-8").catch(() => null);
  if (content === null) return;

  let instances: { deviceId: string }[];
  try {
    instances = JSON.parse(content);
  } catch {
    log.error(`Malformed Speculos tracking file ${fullPath}. Keeping file for recovery`);
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
    log.warn(
      `Released ${instances.length - failed.length}/${instances.length} Speculos instance(s) tracked by worker ${ownerPid}: ${instances.map(({ deviceId }) => deviceId).join(", ")}`,
    );
  }
  if (failed.length) {
    log.error(`Could not release Speculos: ${failed.join(", ")}. Keeping ${fullPath} for recovery`);
    return;
  }
  await fs.unlink(fullPath).catch(() => {});
}

/**
 * Releases the Speculos listed in workers' tracking files; with `orphansOnly`, only
 * those of dead workers (see docs/stall-watchdog.md).
 */
export async function releaseTrackedSpeculos({
  orphansOnly,
}: {
  orphansOnly: boolean;
}): Promise<void> {
  try {
    const files = await fs.readdir(ARTIFACTS_DIR).catch((): string[] => []);
    const trackingFiles = files.flatMap(file => {
      const ownerPid = SPECULOS_TRACKING_FILE_PATTERN.exec(file)?.groups?.ownerPid;
      if (ownerPid === undefined || (orphansOnly && isAlive(Number(ownerPid)))) return [];
      return [{ fullPath: path.join(ARTIFACTS_DIR, file), ownerPid }];
    });

    await Promise.all(
      trackingFiles.map(({ fullPath, ownerPid }) => releaseTrackingFile(fullPath, ownerPid)),
    );
  } catch (error) {
    log.error("Speculos cleanup failed:", sanitizeError(error));
  }
}
