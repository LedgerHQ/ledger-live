import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { getActiveConnectedDevice, useDeviceManagementKit } from "@ledgerhq/live-dmk-mobile";
import { useDispatch, useSelector } from "~/context/hooks";
import { useKeepScreenAwake } from "~/hooks/useKeepScreenAwake";
import type { BaseNavigation } from "~/components/RootNavigator/types/helpers";
import { deviceBackupStorage } from "../../storage/deviceBackupStorage";
import { clearOsUpdates, osUpdatesSelector } from "../../state/osUpdateSlice";
import { resetToMyLedger } from "../../utils/myLedgerNavigation";

export type OsUpdateFlowMode = "bootloaderRepair" | "restoreBackup";

export function useOsUpdateFlowViewModel(device: Device, mode?: OsUpdateFlowMode) {
  const isBootloaderRepair = mode === "bootloaderRepair";
  // Both modes run the orchestrator without a resolved OS update, as soon as the screen opens.
  const hasNoResolvedUpdate = mode !== undefined;
  const navigation = useNavigation<BaseNavigation>();
  const dispatch = useDispatch();
  const dmk = useDeviceManagementKit();
  const { shouldDisplayMyWallet } = useWalletFeaturesConfig("mobile");

  const resolvedOsUpdates = useSelector(osUpdatesSelector);
  const [osUpdates] = useState(hasNoResolvedUpdate ? [] : resolvedOsUpdates);
  const connectedDevice = useMemo(
    () => (dmk ? getActiveConnectedDevice(dmk, device) : undefined),
    [dmk, device],
  );

  const [isStarted, setIsStarted] = useState(hasNoResolvedUpdate);
  useKeepScreenAwake(isStarted);

  const latestOsUpdate = osUpdates.at(-1);
  const canRun = Boolean(dmk && connectedDevice && (latestOsUpdate || hasNoResolvedUpdate));

  const reconnectToMyLedger = useCallback(
    () =>
      resetToMyLedger(navigation, {
        device: isBootloaderRepair ? undefined : device,
        shouldDisplayMyWallet,
      }),
    [navigation, device, shouldDisplayMyWallet, isBootloaderRepair],
  );

  useEffect(() => {
    if (!canRun) reconnectToMyLedger();
  }, [canRun, reconnectToMyLedger]);

  const onCompleted = useCallback(() => {
    dispatch(clearOsUpdates());
  }, [dispatch]);

  const onConfirmStart = useCallback(() => setIsStarted(true), []);

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

  return { whatsNew, orchestratorRun, onConfirmStart, onClose };
}
