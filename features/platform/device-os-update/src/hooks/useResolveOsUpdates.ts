import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import type { DeviceManagementKit, DeviceModelId } from "@ledgerhq/device-management-kit";
import { setHasBackup, setOsUpdates } from "@domain/entity-device-os-update";
import type { DeviceBackupStorage } from "../types/DeviceBackupStorage";
import { ResolveOsUpdatesUseCase } from "../use-cases/ResolveOsUpdatesUseCase/ResolveOsUpdatesUseCase";

export type UseResolveOsUpdatesParams = Readonly<{
  enabled: boolean;
  /** The device is connected and its info is known: the OS update path can be resolved. */
  ready: boolean;
  dmk: DeviceManagementKit | null | undefined;
  backupStorage: DeviceBackupStorage;
  device: Readonly<{ modelId: DeviceModelId; wired: boolean }> | undefined;
  deviceInfo: Readonly<{ version: string; isBootloader: boolean }> | null | undefined;
}>;

/**
 * Resolves the OS update path of the connected device once it is ready, and stores it in the
 * `deviceOsUpdate` entity, along with whether a backup of the device model is waiting to be
 * restored.
 *
 * @returns true while the path is being resolved
 */
export function useResolveOsUpdates({
  enabled,
  ready,
  dmk,
  backupStorage,
  device,
  deviceInfo,
}: UseResolveOsUpdatesParams): boolean {
  const dispatch = useDispatch();
  const [settled, setSettled] = useState(false);

  const modelId = device?.modelId;
  const wired = device?.wired;
  const osVersion = deviceInfo?.version;
  const isBootloader = deviceInfo?.isBootloader;
  const shouldResolve = enabled && ready;

  useEffect(() => {
    if (!shouldResolve) return;

    let cancelled = false;
    const resolving =
      dmk && modelId !== undefined && wired !== undefined && osVersion !== undefined
        ? new ResolveOsUpdatesUseCase().execute({
            dmk,
            backupStorage,
            modelId,
            wired,
            osVersion,
            isBootloader: isBootloader ?? false,
          })
        : Promise.resolve({ osUpdates: [], hasBackup: false });
    resolving
      .then(({ osUpdates, hasBackup }) => {
        if (cancelled) return;
        dispatch(setOsUpdates(osUpdates));
        dispatch(setHasBackup(hasBackup));
      })
      // The use case never fails, but a failure must not leave the resolution pending forever.
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSettled(true);
      });

    return () => {
      cancelled = true;
      setSettled(false);
    };
  }, [shouldResolve, dmk, backupStorage, dispatch, modelId, wired, osVersion, isBootloader]);

  return shouldResolve && !settled;
}
