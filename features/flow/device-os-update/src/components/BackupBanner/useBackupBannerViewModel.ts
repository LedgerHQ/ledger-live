import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { DeviceModelId } from "@ledgerhq/device-management-kit";
import { track, trackPage } from "@shared/analytics";
import { selectHasBackup, setHasBackup } from "@domain/entity-device-os-update";
import { OsUpdateFlowMode } from "../../types/OsUpdateFlowMode";
import type { DeviceBackupStorage } from "@features/platform-device-os-update";
import { getSharedAnalytics } from "../../analytics/getSharedAnalytics";
import { OsUpdateButton, OsUpdatePage } from "../../analytics/analyticsTypes";

export type BackupBannerProps = Readonly<{
  modelId: DeviceModelId;
  wired: boolean;
  /** The Ledger Wallet model id sent in analytics. */
  analyticsModelId: string;
  backupStorage: DeviceBackupStorage;
  /** Opens the OS update flow in restore mode. */
  onRestore: () => void;
}>;

export type BackupBannerConfirmation = "restore" | "delete";

const CONFIRMATION_PAGES: Record<BackupBannerConfirmation, OsUpdatePage> = {
  restore: OsUpdatePage.RESTORE_CONFIRMATION,
  delete: OsUpdatePage.DELETE_CONFIRMATION,
};

export function useBackupBannerViewModel({
  modelId,
  wired,
  analyticsModelId,
  backupStorage,
  onRestore: openRestoreFlow,
}: BackupBannerProps) {
  const dispatch = useDispatch();
  const hasBackup = useSelector(selectHasBackup);
  const [confirmation, setConfirmation] = useState<BackupBannerConfirmation | null>(null);

  const isVisible = hasBackup;

  const sharedAnalytics = useMemo(
    () =>
      getSharedAnalytics({
        modelId: analyticsModelId,
        wired,
        mode: OsUpdateFlowMode.RESTORE_BACKUP,
        updateCount: 0,
      }),
    [analyticsModelId, wired],
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
    openRestoreFlow();
  }, [trackClick, openRestoreFlow]);

  const onConfirmDelete = useCallback(async () => {
    trackClick(OsUpdatePage.DELETE_CONFIRMATION, OsUpdateButton.DELETE_BACKUP);
    setConfirmation(null);
    try {
      await backupStorage.removeBackup(modelId);
      dispatch(setHasBackup(false));
    } catch {
      // The backup is still stored: keep offering it.
    }
  }, [trackClick, dispatch, backupStorage, modelId]);

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
