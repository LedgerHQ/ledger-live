import React from "react";
import { useTranslation } from "react-i18next";
import { DeleteBackupStepProps } from "./types";
import { Flex, Text } from "@ledgerhq/react-ui";
import ButtonV3 from "~/renderer/components/ButtonV3";
import { useWalletSyncAnalytics, AnalyticsPage } from "../../useWalletSyncAnalytics";
import TrackPage from "~/renderer/analytics/TrackPage";

export default function DeleteBackupStep({ cancel, deleteBackup }: DeleteBackupStepProps) {
  const { t } = useTranslation();

  const { onClickTrack } = useWalletSyncAnalytics();

  const handleDeleteBackup = () => {
    onClickTrack({ button: "delete", page: AnalyticsPage.ConfirmDeleteBackup });
    deleteBackup();
  };

  const handleCancel = () => {
    onClickTrack({ button: "dcancel", page: AnalyticsPage.ConfirmDeleteBackup });
    cancel();
  };

  return (
    <Flex flexDirection="column" rowGap="24px">
      <TrackPage category={AnalyticsPage.ConfirmDeleteBackup} />
      <Text fontSize={23} variant="large" color="neutral.c100">
        {t("walletSync.manageBackups.deleteBackup.title")}
      </Text>

      <Text fontSize={14} variant="body" color="neutral.c70">
        {t("walletSync.manageBackups.deleteBackup.description")}
      </Text>

      <Flex flexDirection="row" alignItems="flex-start">
        <ButtonV3 onClick={handleCancel} variant="shade">
          {t("walletSync.manageBackups.deleteBackup.cancel")}
        </ButtonV3>
        <ButtonV3 onClick={handleDeleteBackup} variant="main" ml={4}>
          {t("walletSync.manageBackups.deleteBackup.delete")}
        </ButtonV3>
      </Flex>
    </Flex>
  );
}
