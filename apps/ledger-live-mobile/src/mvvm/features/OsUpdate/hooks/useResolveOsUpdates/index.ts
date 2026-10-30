import { useEffect, useState } from "react";
import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import {
  hasAnythingToRestore,
  ledgerToDmkDeviceIdMap,
  ResolveOsUpdatePathUseCase,
  type OsUpdate,
} from "@ledgerhq/live-dmk-shared";
import { getActiveConnectedDevice, useDeviceManagementKit } from "@ledgerhq/live-dmk-mobile";
import type { DeviceInfo } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useDispatch } from "~/context/hooks";
import { isOsUpdateSupported } from "../../utils/isOsUpdateSupported";
import { setHasBackup, setOsUpdates } from "../../state/osUpdateSlice";
import { deviceBackupStorage } from "../../storage/deviceBackupStorage";

type UseResolveOsUpdatesParams = {
  enabled: boolean;
  /** The device is connected and its info is known: the OS update path can be resolved. */
  ready: boolean;
  device: Device | null | undefined;
  deviceInfo: DeviceInfo | null | undefined;
};

async function resolveOsUpdates(
  dmk: DeviceManagementKit | null,
  device: Pick<Device, "wired">,
): Promise<OsUpdate[]> {
  const connectedDevice = dmk && getActiveConnectedDevice(dmk, device);
  if (!dmk || !connectedDevice) return [];
  try {
    return await new ResolveOsUpdatePathUseCase().execute({
      dmk,
      sessionId: connectedDevice.sessionId,
    });
  } catch {
    return [];
  }
}

async function hasStoredBackup(modelId: Device["modelId"] | undefined): Promise<boolean> {
  if (modelId === undefined) return false;
  try {
    return hasAnythingToRestore(
      await deviceBackupStorage.getBackup(ledgerToDmkDeviceIdMap[modelId]),
    );
  } catch {
    return false;
  }
}

/**
 * Resolves the OS update path of the connected device once it is ready, and stores it in the
 * `osUpdate` slice, along with whether a backup of the device model is waiting to be restored. Never fails: an unsupported device or a resolve error stores an empty list.
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
  const dispatch = useDispatch();
  const [settled, setSettled] = useState(false);

  const wired = device?.wired;
  const modelId = device?.modelId;

  const shouldResolve = enabled && ready;
  const canResolve =
    wired !== undefined &&
    modelId !== undefined &&
    !!deviceInfo &&
    !deviceInfo.isBootloader &&
    isOsUpdateSupported({ modelId, version: deviceInfo.version, wired });

  useEffect(() => {
    if (!shouldResolve) return;

    let cancelled = false;
    const resolving =
      canResolve && wired !== undefined && modelId !== undefined
        ? resolveOsUpdates(dmk, { wired })
        : Promise.resolve([]);
    const settle = ([osUpdates, hasBackup]: [OsUpdate[], boolean]) => {
      if (cancelled) return;
      dispatch(setOsUpdates(osUpdates));
      dispatch(setHasBackup(hasBackup));
      setSettled(true);
    };
    Promise.all([resolving, hasStoredBackup(modelId)]).then(settle, () => settle([[], false]));

    return () => {
      cancelled = true;
      setSettled(false);
    };
  }, [shouldResolve, canResolve, dmk, dispatch, wired, modelId]);

  return shouldResolve && !settled;
}
