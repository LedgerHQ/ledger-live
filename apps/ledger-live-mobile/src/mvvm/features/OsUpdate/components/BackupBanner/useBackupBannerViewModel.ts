import { useCallback, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { ledgerToDmkDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useDispatch, useSelector } from "~/context/hooks";
import type { BaseNavigation } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { hasBackupSelector, hasOsUpdatesSelector, setHasBackup } from "../../state/osUpdateSlice";
import { deviceBackupStorage } from "../../storage/deviceBackupStorage";

export type BackupBannerConfirmation = "restore" | "delete";

export function useBackupBannerViewModel(device: Device) {
  const navigation = useNavigation<BaseNavigation>();
  const dispatch = useDispatch();
  const hasBackup = useSelector(hasBackupSelector);
  const hasOsUpdates = useSelector(hasOsUpdatesSelector);
  const [confirmation, setConfirmation] = useState<BackupBannerConfirmation | null>(null);

  const isVisible = hasBackup && !hasOsUpdates;

  const onRestore = useCallback(() => setConfirmation("restore"), []);
  const onDelete = useCallback(() => setConfirmation("delete"), []);
  const onCancelConfirmation = useCallback(() => setConfirmation(null), []);

  const onConfirmRestore = useCallback(() => {
    setConfirmation(null);
    navigation.navigate(ScreenName.OsUpdate, { device, mode: "restoreBackup" });
  }, [navigation, device]);

  const onConfirmDelete = useCallback(async () => {
    setConfirmation(null);
    try {
      await deviceBackupStorage.removeBackup(ledgerToDmkDeviceIdMap[device.modelId]);
      dispatch(setHasBackup(false));
    } catch {
      // The backup is still stored: keep offering it.
    }
  }, [dispatch, device.modelId]);

  return {
    isVisible,
    confirmation,
    onRestore,
    onDelete,
    onCancelConfirmation,
    onConfirmRestore,
    onConfirmDelete,
  };
}
