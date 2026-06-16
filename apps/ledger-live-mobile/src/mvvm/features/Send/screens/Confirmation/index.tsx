import React from "react";
import { useTranslation } from "~/context/Locale";
import { ConfirmationScreenView } from "./components/ConfirmationScreenView";
import { useConfirmationViewModel } from "./hooks/useConfirmationViewModel";

export function ConfirmationScreen() {
  const { t } = useTranslation();
  const { canViewTransaction, onViewTransaction, onClose } = useConfirmationViewModel();

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
