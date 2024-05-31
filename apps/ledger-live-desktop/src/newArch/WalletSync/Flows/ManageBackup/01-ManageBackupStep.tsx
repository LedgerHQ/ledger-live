import { Flex, Icons, Text } from "@ledgerhq/react-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/Card";
import styled, { useTheme } from "styled-components";
import { rgba } from "~/renderer/styles/helpers";
import { ManageBackupStepProps } from "./types";

export default function ManageBackupStep({ goToDeleteBackup }: ManageBackupStepProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Flex flexDirection="column" rowGap="24px">
      <Text fontSize={23} variant="large">
        {t("walletSync.manageBackups.title")}
      </Text>

      <Card
        testId="walletSync-manage-backup-delete"
        title="walletSync.manageBackups.options.deleteBackup.title"
        description="walletSync.manageBackups.options.deleteBackup.description"
        onClick={goToDeleteBackup}
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
