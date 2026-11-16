import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearOsUpdates, selectOsUpdates, setHasBackup } from "@domain/entity-device-os-update";
import { findLastConnectedDevice } from "@features/platform-device-kit";
import { useOsUpdatePorts } from "../../hooks/OsUpdatePortsProvider";
import { OsUpdateFlowMode } from "../../types/OsUpdateFlowMode";
import type { OsUpdateDevice } from "../../types/OsUpdateDevice";
import { OS_RELEASE_NOTES_URLS } from "../../utils/urls";

export type OsUpdateFlowProps = Readonly<{
  device: OsUpdateDevice;
  mode?: OsUpdateFlowMode;
  /** Leaves the flow from its What's new screen, before it starts. */
  onClose: () => void;
  /**
   * Leaves the flow once it stopped, to reconnect the device from My Ledger. The device is
   * `undefined` after a bootloader repair: it has to be picked again.
   */
  onReconnect: (device: OsUpdateDevice | undefined) => void;
}>;

export function useOsUpdateFlowViewModel({
  device,
  mode,
  onClose,
  onReconnect,
}: OsUpdateFlowProps) {
  const isBootloaderRepair = mode === OsUpdateFlowMode.BOOTLOADER_REPAIR;
  // Both modes run the orchestrator without a resolved OS update, as soon as the screen opens.
  const hasNoResolvedUpdate = mode !== undefined;
  const dispatch = useDispatch();
  const { dmk, backupStorage, getDeviceModel, getLastSeenOsVersion, keepScreenAwake, openUrl } =
    useOsUpdatePorts();

  const resolvedOsUpdates = useSelector(selectOsUpdates);
  const [osUpdates] = useState(hasNoResolvedUpdate ? [] : resolvedOsUpdates);
  const connectedDevice = useMemo(
    () => findLastConnectedDevice(dmk, { wired: device.wired }),
    [dmk, device.wired],
  );
  const { modelId } = device;

  const [isStarted, setIsStarted] = useState(hasNoResolvedUpdate);
  useEffect(() => (isStarted ? keepScreenAwake() : undefined), [isStarted, keepScreenAwake]);

  const latestOsUpdate = osUpdates.at(-1);
  const canRun = Boolean(connectedDevice && (latestOsUpdate || hasNoResolvedUpdate));

  const reconnectToMyLedger = useCallback(
    () => onReconnect(isBootloaderRepair ? undefined : device),
    [onReconnect, device, isBootloaderRepair],
  );

  useEffect(() => {
    if (!canRun) reconnectToMyLedger();
  }, [canRun, reconnectToMyLedger]);

  const onCompleted = useCallback(() => {
    dispatch(setHasBackup(false));
    dispatch(clearOsUpdates());
  }, [dispatch]);

  const onConfirmStart = useCallback(() => setIsStarted(true), []);

  const onOpenReleaseNotes = useCallback(
    () => openUrl(OS_RELEASE_NOTES_URLS[modelId]),
    [openUrl, modelId],
  );

  const whatsNew = useMemo(
    () =>
      latestOsUpdate
        ? {
            version: latestOsUpdate.finalFirmware.version,
            notes: latestOsUpdate.osuFirmware.notes,
          }
        : null,
    [latestOsUpdate],
  );

  const orchestratorRun = useMemo(
    () =>
      isStarted && connectedDevice
        ? {
            dmk,
            connectedDevice,
            osUpdates,
            backupStorage,
            onStop: reconnectToMyLedger,
            onCompleted,
          }
        : null,
    [isStarted, dmk, connectedDevice, osUpdates, backupStorage, reconnectToMyLedger, onCompleted],
  );

  const analytics = useMemo(
    () =>
      connectedDevice
        ? {
            analyticsModelId: getDeviceModel(modelId).analyticsModelId,
            wired: device.wired,
            mode,
            updateCount: isBootloaderRepair ? undefined : osUpdates.length,
            osVersionFrom: getLastSeenOsVersion(modelId),
            osVersionTo: latestOsUpdate?.finalFirmware.version,
            isStarted,
          }
        : null,
    [
      connectedDevice,
      getDeviceModel,
      getLastSeenOsVersion,
      modelId,
      device.wired,
      mode,
      isBootloaderRepair,
      osUpdates,
      latestOsUpdate,
      isStarted,
    ],
  );

  return { whatsNew, orchestratorRun, onConfirmStart, onOpenReleaseNotes, onClose, analytics };
}

export type OsUpdateFlowViewProps = ReturnType<typeof useOsUpdateFlowViewModel>;
