import { useCallback, useEffect, useMemo, useState } from "react";
import { Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { Device } from "@ledgerhq/live-dmk-shared";
import { OsUpdateFlowMode } from "@ledgerhq/live-common/os-update/types";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import {
  getActiveConnectedDevice,
  rnHidTransportIdentifier,
  useDeviceManagementKit,
} from "@ledgerhq/live-dmk-mobile";
import { useDispatch, useSelector } from "~/context/hooks";
import { useKeepScreenAwake } from "~/hooks/useKeepScreenAwake";
import { lastSeenDeviceSelector } from "~/reducers/settings";
import { urls } from "~/utils/urls";
import type { BaseNavigation } from "~/components/RootNavigator/types/helpers";
import { deviceBackupStorage } from "../../storage/deviceBackupStorage";
import { clearOsUpdates, osUpdatesSelector, setHasBackup } from "../../state/osUpdateSlice";
import { resetToMyLedger } from "../../utils/myLedgerNavigation";

export function useOsUpdateFlowViewModel(device: Device, mode?: OsUpdateFlowMode) {
  const isBootloaderRepair = mode === OsUpdateFlowMode.BOOTLOADER_REPAIR;
  // Both modes run the orchestrator without a resolved OS update, as soon as the screen opens.
  const hasNoResolvedUpdate = mode !== undefined;
  const navigation = useNavigation<BaseNavigation>();
  const dispatch = useDispatch();
  const dmk = useDeviceManagementKit();
  const { shouldDisplayMyWallet } = useWalletFeaturesConfig("mobile");

  const resolvedOsUpdates = useSelector(osUpdatesSelector);
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);
  const [osUpdates] = useState(hasNoResolvedUpdate ? [] : resolvedOsUpdates);
  const wired = device.transport === rnHidTransportIdentifier;
  const connectedDevice = useMemo(
    () => (dmk ? getActiveConnectedDevice(dmk, { wired }) : undefined),
    [dmk, wired],
  );
  const modelId = device.deviceModelId;

  const [isStarted, setIsStarted] = useState(hasNoResolvedUpdate);
  useKeepScreenAwake(isStarted);

  const latestOsUpdate = osUpdates.at(-1);
  const canRun = Boolean(dmk && connectedDevice && (latestOsUpdate || hasNoResolvedUpdate));

  const reconnectToMyLedger = useCallback(
    () =>
      resetToMyLedger(navigation, {
        device: isBootloaderRepair
          ? undefined
          : {
              deviceId: device.id,
              deviceName: device.name,
              modelId: device.deviceModelId,
              wired: device.transport === rnHidTransportIdentifier,
            },
        shouldDisplayMyWallet,
      }),
    [navigation, device, shouldDisplayMyWallet, isBootloaderRepair],
  );

  useEffect(() => {
    if (!canRun) reconnectToMyLedger();
  }, [canRun, reconnectToMyLedger]);

  const onCompleted = useCallback(() => {
    dispatch(setHasBackup(false));
    dispatch(clearOsUpdates());
  }, [dispatch]);

  const onConfirmStart = useCallback(() => setIsStarted(true), []);

  const onOpenReleaseNotes = useCallback(() => {
    Linking.openURL(urls.fwUpdateReleaseNotes[modelId]);
  }, [modelId]);

  const onClose = useCallback(() => navigation.goBack(), [navigation]);

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
      isStarted && dmk && connectedDevice
        ? {
            dmk,
            connectedDevice,
            osUpdates,
            storage: deviceBackupStorage,
            onStop: reconnectToMyLedger,
            onCompleted,
          }
        : null,
    [isStarted, dmk, connectedDevice, osUpdates, reconnectToMyLedger, onCompleted],
  );

  const analytics = useMemo(
    () =>
      connectedDevice
        ? {
            device,
            mode,
            updateCount: isBootloaderRepair ? undefined : osUpdates.length,
            osVersionFrom:
              lastSeenDevice?.modelId === modelId ? lastSeenDevice.deviceInfo.version : undefined,
            osVersionTo: latestOsUpdate?.finalFirmware.version,
            isStarted,
          }
        : null,
    [
      connectedDevice,
      device,
      mode,
      isBootloaderRepair,
      osUpdates,
      lastSeenDevice,
      modelId,
      latestOsUpdate,
      isStarted,
    ],
  );

  return { whatsNew, orchestratorRun, onConfirmStart, onOpenReleaseNotes, onClose, analytics };
}
