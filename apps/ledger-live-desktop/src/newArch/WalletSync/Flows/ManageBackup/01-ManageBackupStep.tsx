import { Flex, Icons, Text } from "@ledgerhq/react-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/Card";
import styled, { useTheme } from "styled-components";
import { rgba } from "~/renderer/styles/helpers";
import { ManageBackupStepProps } from "./types";
import { AnalyticsPage, useWalletSyncAnalytics } from "../../hooks/useWalletSyncAnalytics";
import TrackPage from "~/renderer/analytics/TrackPage";

export default function ManageBackupStep({ goToDeleteBackup }: ManageBackupStepProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const { onClickTrack } = useWalletSyncAnalytics();

  const handleGoDeleteBackup = () => {
    onClickTrack({ button: "delete data", page: AnalyticsPage.ManageBackup });
    goToDeleteBackup();
  };

  return (
    <Flex flexDirection="column" rowGap="24px">
      <TrackPage category={AnalyticsPage.ManageBackup} />
      <Text fontSize={23} variant="large" color="neutral.c100">
        {t("walletSync.manageBackup.title")}
      </Text>

      <Card
        testId="walletSync-manage-backup-delete"
        title="walletSync.manageBackup.options.deleteBackup.title"
        description="walletSync.manageBackup.options.deleteBackup.description"
        onClick={handleGoDeleteBackup}
        leftIcon={
          <IconContainer
            alignItems="center"
            justifyContent="center"
            backgroundColor={rgba(colors.error.c60, 0.25)}
          >
            <Icons.Trash size="M" color={colors.error.c50} />
          </IconContainer>
        }
      />
    </Flex>
  );
}

const IconContainer = styled(Flex)`
  border-radius: 8px;
  height: 40px;
  width: 40px;
`;
