import React from "react";
import { Success } from "../../components/Success";
import { useTranslation } from "react-i18next";
import { Flex } from "@ledgerhq/react-ui";

export default function BackupDeleted() {
  const { t } = useTranslation();
  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="center" height="100%">
      <Success title={t("walletSync.manageBackups.deleteBackupSuccess.title")} />
    </Flex>
  );
}
