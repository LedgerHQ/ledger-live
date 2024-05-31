import React from "react";
import { Success } from "../../components/Success";
import { useTranslation } from "react-i18next";
import { Flex, InfiniteLoader } from "@ledgerhq/react-ui";
import { Error } from "../../components/Error";
import { BackupDeletedProps } from "./types";

export default function BackupDeleted({ isSuccessful, isLoading }: BackupDeletedProps) {
  const { t } = useTranslation();

  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="center" height="100%">
      {isLoading ? (
        <InfiniteLoader size={50} />
      ) : isSuccessful ? (
        <Success title={t("walletSync.manageBackups.deleteBackupSuccess.title")} />
      ) : (
        <Error title={t("walletSync.manageBackups.deleteBackupError.title")} />
      )}
    </Flex>
  );
}
