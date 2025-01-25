import React from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "@ledgerhq/native-ui";

export function AlertLedgerSyncDown() {
  const { t } = useTranslation();
  return (
    <Alert
      type="warning"
      title={t("walletSync.walletSyncActivated.errors.ledgerSyncUnavailable")}
    />
  );
}
