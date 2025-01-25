import React from "react";
import { Success } from "../../components/Success";
import { useTranslation } from "react-i18next";
import { Flex } from "@ledgerhq/react-ui";
import { Error } from "../../components/Error";
import { BackupDeletedProps } from "./types";
import { AnalyticsPage, useLedgerSyncAnalytics } from "../../hooks/useLedgerSyncAnalytics";
import { useDispatch } from "react-redux";
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
        <Success
          title={t("walletSync.manageBackup.deleteBackupSuccess.title")}
          description={t("walletSync.manageBackup.deleteBackupSuccess.description")}
          withClose
          onClose={onClose}
          analyticsPage={AnalyticsPage.BackupDeleted}
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
