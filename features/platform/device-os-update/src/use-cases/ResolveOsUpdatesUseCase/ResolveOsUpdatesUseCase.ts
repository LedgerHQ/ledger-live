import type { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { OsUpdate } from "@domain/entity-device-os-update";
import { hasAnythingToRestore } from "../../utils/hasAnythingToRestore";
import { isOsUpdateSupported } from "../../utils/isOsUpdateSupported";
import type { DeviceBackupStorage } from "../../types/DeviceBackupStorage";
import type { ResolvedOsUpdates, ResolveOsUpdatesInput } from "../../types/ResolveOsUpdates";
import { executeResolveOsUpdatePath } from "./executeResolveOsUpdatePath";
import { findLastConnectedDevice } from "@features/platform-device-kit";

async function resolveOsUpdatePath({
  dmk,
  modelId,
  wired,
  osVersion,
  isBootloader,
}: ResolveOsUpdatesInput): Promise<OsUpdate[]> {
  if (isBootloader || !isOsUpdateSupported({ modelId, version: osVersion, wired })) return [];
  const connectedDevice = findLastConnectedDevice(dmk, { wired });
  if (!connectedDevice) return [];
  try {
    return await executeResolveOsUpdatePath({
      dmk,
      sessionId: connectedDevice.sessionId,
    });
  } catch {
    return [];
  }
}

async function hasStoredBackup(
  backupStorage: DeviceBackupStorage,
  modelId: DeviceModelId,
): Promise<boolean> {
  try {
    return hasAnythingToRestore(await backupStorage.getBackup(modelId));
  } catch {
    return false;
  }
}

/**
 * Resolves the OS update path of the connected device, and whether a backup of its model waits to
 * be restored. Never fails: an unsupported device or a resolve error gives no update.
 */
export class ResolveOsUpdatesUseCase {
  async execute(input: ResolveOsUpdatesInput): Promise<ResolvedOsUpdates> {
    const [osUpdates, hasBackup] = await Promise.all([
      resolveOsUpdatePath(input),
      hasStoredBackup(input.backupStorage, input.modelId),
    ]);
    return { osUpdates, hasBackup };
  }
}
