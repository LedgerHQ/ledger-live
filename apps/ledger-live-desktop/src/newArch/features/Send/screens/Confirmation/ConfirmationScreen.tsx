import React from "react";
import { useTranslation } from "react-i18next";
import { useConfirmationViewModel } from "./hooks/useConfirmationViewModel";
import { ConfirmationBody } from "./components/ConfirmationBody";
import { ConfirmationFooter } from "./components/ConfirmationFooter";

export const ConfirmationScreen = () => {
  const { t } = useTranslation();
  const { status, transactionError, onViewDetails, onRetry, onClose } = useConfirmationViewModel();

  return (
    <>
      <ConfirmationBody status={status} transactionError={transactionError ?? undefined} />

      <ConfirmationFooter
        status={status}
        onViewDetails={onViewDetails}
        onClose={onClose}
        onRetry={onRetry}
        t={t}
      />
    </>
  );
};
