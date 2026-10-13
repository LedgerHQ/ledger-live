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

export function useOsUpdateFlowViewModel(device: Device, mode?: "bootloaderRepair") {
  const isBootloaderRepair = mode === "bootloaderRepair";
  const navigation = useNavigation<BaseNavigation>();
  const dispatch = useDispatch();
  const dmk = useDeviceManagementKit();
  const { shouldDisplayMyWallet } = useWalletFeaturesConfig("mobile");

  const resolvedOsUpdates = useSelector(osUpdatesSelector);
  const [osUpdates] = useState(isBootloaderRepair ? [] : resolvedOsUpdates);
  const connectedDevice = useMemo(
    () => (dmk ? getActiveConnectedDevice(dmk, device) : undefined),
    [dmk, device],
  );

  const [isStarted, setIsStarted] = useState(isBootloaderRepair);
  useKeepScreenAwake(isStarted);

  const latestOsUpdate = osUpdates.at(-1);
  const canRun = Boolean(dmk && connectedDevice && (latestOsUpdate || isBootloaderRepair));

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
