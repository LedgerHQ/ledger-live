import { useMemo } from "react";
import { useResolveOsUpdates as useResolveDeviceOsUpdates } from "@features/platform-device-os-update";
import { ledgerToDmkDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { useDeviceManagementKit } from "@ledgerhq/live-dmk-mobile";
import type { DeviceInfo } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { deviceBackupStorage } from "../../storage/deviceBackupStorage";

type UseResolveOsUpdatesParams = {
  enabled: boolean;
  /** The device is connected and its info is known: the OS update path can be resolved. */
  ready: boolean;
  device: Device | null | undefined;
  deviceInfo: DeviceInfo | null | undefined;
};

/**
 * Resolves the OS update path of the device connected by the manager action.
 *
 * @returns true while the path is being resolved
 */
export function useResolveOsUpdates({
  enabled,
  ready,
  device,
  deviceInfo,
}: UseResolveOsUpdatesParams): boolean {
  const dmk = useDeviceManagementKit();
  const modelId = device?.modelId;
  const wired = device?.wired;
  const osUpdateDevice = useMemo(
    () =>
      modelId !== undefined && wired !== undefined
        ? { modelId: ledgerToDmkDeviceIdMap[modelId], wired }
        : undefined,
    [modelId, wired],
  );

  return useResolveDeviceOsUpdates({
    enabled,
    ready,
    dmk,
    backupStorage: deviceBackupStorage,
    device: osUpdateDevice,
    deviceInfo,
  });
}
