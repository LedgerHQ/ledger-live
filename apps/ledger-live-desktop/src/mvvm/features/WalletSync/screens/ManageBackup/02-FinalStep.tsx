import React from "react";
import { GenericStatusDisplay } from "../../components/GenericStatusDisplay";
import { useTranslation } from "react-i18next";
import { Flex } from "@ledgerhq/react-ui";
import { Error } from "../../components/Error";
import { BackupDeletedProps } from "./types";
import { AnalyticsPage, useLedgerSyncAnalytics } from "../../hooks/useLedgerSyncAnalytics";
import { useDispatch } from "LLD/hooks/redux";
import { setDrawerVisibility } from "~/renderer/actions/walletSync";

export default function BackupDeleted({ isSuccessful }: BackupDeletedProps) {
  const { t } = useTranslation();

  const { onClickTrack } = useLedgerSyncAnalytics();

  const dispatch = useDispatch();

  const onClose = () => {
    dispatch(setDrawerVisibility(false));
    onClickTrack({
      button: "Close",
      page: AnalyticsPage.BackupDeleted,
    });
  };

  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="center" height="100%">
      {isSuccessful ? (
        <GenericStatusDisplay
          title={t("walletSync.manageBackup.deleteBackupSuccess.title")}
          description={t("walletSync.manageBackup.deleteBackupSuccess.description")}
          withClose
          onClose={onClose}
          analyticsPage={AnalyticsPage.BackupDeleted}
          type="success"
          testId="walletsync-delete-backup-success-title"
        />
      ) : (
        <Error
          title={t("walletSync.manageBackup.deleteBackupError.title")}
          analyticsPage={AnalyticsPage.BackupDeletionError}
        />
      )}
    </Flex>
  );
}
