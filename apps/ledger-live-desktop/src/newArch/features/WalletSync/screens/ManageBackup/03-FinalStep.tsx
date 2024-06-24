import React from "react";
import { Success } from "../../components/Success";
import { useTranslation } from "react-i18next";
import { Flex } from "@ledgerhq/react-ui";
import { Error } from "../../components/Error";
import { BackupDeletedProps } from "./types";

export default function BackupDeleted({ isSuccessful }: BackupDeletedProps) {
  const { t } = useTranslation();

  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="center" height="100%">
      {isSuccessful ? (
        <Success title={t("walletSync.manageBackup.deleteBackupSuccess.title")} />
      ) : (
        <Error title={t("walletSync.manageBackup.deleteBackupError.title")} />
      )}
    </Flex>
  );
}
