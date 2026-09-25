import { log } from "detox";
import { execFile } from "child_process";
import * as fs from "fs/promises";
import * as path from "path";
import { promisify } from "util";
import { releaseSpeculosDeviceCI } from "@ledgerhq/live-e2e-shared/speculosCI";
import { sanitizeError } from "@ledgerhq/live-e2e-shared/index";
import { isSpeculosRemote } from "@e2e/helpers/commonHelpers";
import { ARTIFACTS_DIR, SPECULOS_TRACKING_FILE_PATTERN } from "@e2e/utils/speculosUtils";

const execFileAsync = promisify(execFile);

// Signal 0 only probes. EPERM means the process exists but belongs to someone else.
function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error instanceof Error && "code" in error && error.code === "EPERM";
  }
}

async function releaseSpeculos(deviceId: string): Promise<void> {
  if (isSpeculosRemote()) {
    await releaseSpeculosDeviceCI(deviceId);
  } else {
    // A local instance is a container named after its id, so any process can remove it.
    await execFileAsync("docker", ["rm", "-f", deviceId]);
  }
}

async function releaseTrackingFile(fullPath: string, owner: string): Promise<void> {
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
    // warn, not info: CI runs detox with `--loglevel warn`, which hides info lines.
    log.warn(
      `Released ${instances.length - failed.length}/${instances.length} Speculos instance(s) tracked by worker ${owner}: ${instances.map(({ deviceId }) => deviceId).join(", ")}`,
    );
  }
  if (failed.length) {
    log.error(`Could not release Speculos: ${failed.join(", ")}. Keeping ${fullPath} for recovery`);
    return;
  }
  await fs.unlink(fullPath).catch(() => {});
}

/**
 * Releases, from the controller, the Speculos instances that workers recorded in
 * their artifacts/speculos-instances.<pid>.json files.
 *
 * A worker releases its own instances in its environment teardown, which it never
 * reaches when it dies mid-spec: killed by the stall watchdog, the OOM killer or a
 * native crash. With `orphansOnly`, only the files of workers that are gone are
 * swept, so a live worker, or another run in the same checkout, keeps its devices.
 */
export async function releaseTrackedSpeculos({
  orphansOnly,
}: {
  orphansOnly: boolean;
}): Promise<void> {
  try {
    const files = await fs.readdir(ARTIFACTS_DIR).catch((): string[] => []);
    const trackingFiles = files.flatMap(file => {
      const owner = SPECULOS_TRACKING_FILE_PATTERN.exec(file)?.[1];
      if (owner === undefined || (orphansOnly && isAlive(Number(owner)))) return [];
      return [{ fullPath: path.join(ARTIFACTS_DIR, file), owner }];
    });

    await Promise.all(
      trackingFiles.map(({ fullPath, owner }) => releaseTrackingFile(fullPath, owner)),
    );
  } catch (error) {
    log.error("Speculos cleanup failed:", sanitizeError(error));
  }
}
