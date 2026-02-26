import React from "react";
import { useTranslation } from "react-i18next";
import { DialogBody } from "@ledgerhq/lumen-ui-react";
import { useConfirmationViewModel } from "./hooks/useConfirmationViewModel";
import { ConfirmationBody } from "./components/ConfirmationBody";
import { ConfirmationFooter } from "./components/ConfirmationFooter";

export const ConfirmationScreen = () => {
  const { t } = useTranslation();
  const { status, transactionError, onViewDetails, onRetry, onClose } = useConfirmationViewModel();

  return (
    <>
      <DialogBody className="py-16">
        <ConfirmationBody status={status} transactionError={transactionError ?? undefined} />
      </DialogBody>

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
