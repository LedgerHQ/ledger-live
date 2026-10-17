import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { track, trackPage } from "@shared/analytics";
import { rnHidTransportIdentifier } from "@ledgerhq/live-dmk-mobile";
import { ledgerToDmkDeviceIdMap, type Device } from "@ledgerhq/live-dmk-shared";
import { OsUpdateFlowMode } from "@ledgerhq/live-common/os-update/types";
import { useDispatch, useSelector } from "~/context/hooks";
import type { BaseNavigation } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { getSharedAnalytics } from "../../analytics/getSharedAnalytics";
import { OsUpdateButton, OsUpdatePage } from "../../analytics/types";
import { hasBackupSelector, hasOsUpdatesSelector, setHasBackup } from "../../state/osUpdateSlice";
import { deviceBackupStorage } from "../../storage/deviceBackupStorage";

export type BackupBannerConfirmation = "restore" | "delete";

const CONFIRMATION_PAGES: Record<BackupBannerConfirmation, OsUpdatePage> = {
  restore: OsUpdatePage.RESTORE_CONFIRMATION,
  delete: OsUpdatePage.DELETE_CONFIRMATION,
};

export function useBackupBannerViewModel(device: Device) {
  const navigation = useNavigation<BaseNavigation>();
  const dispatch = useDispatch();
  const hasBackup = useSelector(hasBackupSelector);
  const hasOsUpdates = useSelector(hasOsUpdatesSelector);
  const [confirmation, setConfirmation] = useState<BackupBannerConfirmation | null>(null);

  const isVisible = hasBackup && !hasOsUpdates;

  // Not `device` itself: callers rebuild it on every render, which would resend the pages.
  const { deviceModelId, transport } = device;
  const sharedAnalytics = useMemo(
    () =>
      getSharedAnalytics({
        modelId: deviceModelId,
        wired: transport === rnHidTransportIdentifier,
        mode: OsUpdateFlowMode.RESTORE_BACKUP,
        updateCount: 0,
      }),
    [deviceModelId, transport],
  );
  const trackClick = useCallback(
    (page: OsUpdatePage, button: OsUpdateButton) =>
      track("button_clicked", { button, page, ...sharedAnalytics }),
    [sharedAnalytics],
  );

  useEffect(() => {
    if (!isVisible) return;
    trackPage({ category: OsUpdatePage.BACKUP_BANNER, props: sharedAnalytics });
  }, [isVisible, sharedAnalytics]);

  useEffect(() => {
    if (!confirmation) return;
    trackPage({ category: CONFIRMATION_PAGES[confirmation], props: sharedAnalytics });
  }, [confirmation, sharedAnalytics]);

  const onRestore = useCallback(() => {
    trackClick(OsUpdatePage.BACKUP_BANNER, OsUpdateButton.RESTORE);
    setConfirmation("restore");
  }, [trackClick]);
  const onDelete = useCallback(() => {
    trackClick(OsUpdatePage.BACKUP_BANNER, OsUpdateButton.DELETE_BACKUP);
    setConfirmation("delete");
  }, [trackClick]);
  const onDismissConfirmation = useCallback(() => setConfirmation(null), []);
  const onCancelConfirmation = useCallback(() => {
    if (confirmation) trackClick(CONFIRMATION_PAGES[confirmation], OsUpdateButton.CANCEL);
    setConfirmation(null);
  }, [confirmation, trackClick]);

  const onConfirmRestore = useCallback(() => {
    trackClick(OsUpdatePage.RESTORE_CONFIRMATION, OsUpdateButton.RESTORE);
    setConfirmation(null);
    navigation.navigate(ScreenName.OsUpdate, {
      device,
      mode: OsUpdateFlowMode.RESTORE_BACKUP,
    });
  }, [trackClick, navigation, device]);

  const onConfirmDelete = useCallback(async () => {
    trackClick(OsUpdatePage.DELETE_CONFIRMATION, OsUpdateButton.DELETE_BACKUP);
    setConfirmation(null);
    try {
      await deviceBackupStorage.removeBackup(ledgerToDmkDeviceIdMap[device.deviceModelId]);
      dispatch(setHasBackup(false));
    } catch {
      // The backup is still stored: keep offering it.
    }
  }, [trackClick, dispatch, device]);

  return {
    isVisible,
    confirmation,
    onRestore,
    onDelete,
    onDismissConfirmation,
    onCancelConfirmation,
    onConfirmRestore,
    onConfirmDelete,
  };
}
