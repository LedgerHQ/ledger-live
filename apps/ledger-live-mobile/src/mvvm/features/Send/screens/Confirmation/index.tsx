import React from "react";
import { FLOW_STATUS } from "@ledgerhq/live-common/flows/wizard/types";
import { useTranslation } from "~/context/Locale";
import { ConfirmationScreenView } from "./components/ConfirmationScreenView";
import { ConfirmationErrorView } from "./components/ConfirmationErrorView";
import { useConfirmationViewModel } from "./hooks/useConfirmationViewModel";

export function ConfirmationScreen() {
  const { t } = useTranslation();
  const {
    status,
    transactionError,
    canViewTransaction,
    onViewTransaction,
    onSaveLogs,
    onRetry,
    onClose,
  } = useConfirmationViewModel();

  if (status === FLOW_STATUS.ERROR) {
    return (
      <ConfirmationErrorView
        error={transactionError}
        saveLogsLabel={t("common.saveLogs")}
        retryLabel={t("common.tryAgain")}
        closeLabel={t("common.close")}
        onSaveLogs={onSaveLogs}
        onRetry={onRetry}
        onClose={onClose}
      />
    );
  }

  return (
    <ConfirmationScreenView
      title={t("send.newSendFlow.transactionSigned")}
      description={t("send.newSendFlow.processingTransaction")}
      viewTransactionLabel={t("send.newSendFlow.confirmation.viewTransaction")}
      closeLabel={t("common.close")}
      canViewTransaction={canViewTransaction}
      onViewTransaction={onViewTransaction}
      onClose={onClose}
    />
  );
}
