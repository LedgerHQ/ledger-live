import type { DeviceModelId } from "@ledgerhq/types-devices";
import { ledgerToDmkDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { isOsUpdateSupported } from "@features/platform-device-os-update";

type DeviceConnection = Readonly<{ modelId: DeviceModelId; wired: boolean }>;

/**
 * Whether the OS update can run over the device's current transport at its current OS version.
 * An unknown version does not block the update.
 */
export function isOsUpdateTransportSupported(
  { modelId, wired }: DeviceConnection,
  osVersion: string | undefined,
): boolean {
  if (osVersion === undefined) return true;
  return isOsUpdateSupported({
    modelId: ledgerToDmkDeviceIdMap[modelId],
    version: osVersion,
    wired,
  });
}
