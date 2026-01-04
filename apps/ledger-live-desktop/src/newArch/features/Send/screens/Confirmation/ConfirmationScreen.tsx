import React from "react";
import { useTranslation } from "react-i18next";
<<<<<<< HEAD
import { Button, DialogBody, DialogFooter } from "@ledgerhq/lumen-ui-react";
import { useConfirmationViewModel } from "./useConfirmationViewModel";
import { SuccessContent } from "./components/SuccessContent";
import { ErrorContent } from "./components/ErrorContent";
import { InfoContent } from "./components/InfoContent";

export function ConfirmationScreen() {
=======
import { useConfirmationViewModel } from "./hooks/useConfirmationViewModel";
import { ConfirmationBody } from "./components/ConfirmationBody";
import { ConfirmationFooter } from "./components/ConfirmationFooter";

export const ConfirmationScreen = () => {
>>>>>>> 6570c37c6c (feat(LWD): Signature screen (redesign send flow) (with placeholders screens))
  const { t } = useTranslation();
  const { status, transactionError, onViewDetails, onRetry, onClose } = useConfirmationViewModel();

  return (
    <>
<<<<<<< HEAD
      <DialogBody>
        <div className="flex flex-col items-center gap-24 overflow-hidden">
          {status === "success" && <SuccessContent />}
          {status === "refused" && (
            <InfoContent
              titleKey="errors.UserRefusedOnDevice.title"
              descriptionKey="errors.UserRefusedOnDevice.description"
            />
          )}
          {status === "error" && <ErrorContent error={transactionError} />}
        </div>
      </DialogBody>

      <DialogFooter className="px-6">
        {status === "success" && (
          <>
            <Button className="mb-16" appearance="gray" size="lg" isFull onClick={onViewDetails}>
              {t("send.steps.confirmation.success.cta")}
            </Button>
            <Button appearance="base" size="lg" isFull onClick={onClose}>
              {t("common.close")}
            </Button>
          </>
        )}

        {status === "refused" && (
          <>
            <Button className="mb-16" appearance="gray" size="lg" isFull onClick={onRetry}>
              {t("common.tryAgain")}
            </Button>
            <Button appearance="base" size="lg" isFull onClick={onClose}>
              {t("common.close")}
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <Button className="mb-16" appearance="gray" size="lg" isFull onClick={onClose}>
              {t("common.close")}
            </Button>
            <Button appearance="base" size="lg" isFull onClick={onRetry}>
              {t("common.tryAgain")}
            </Button>
          </>
        )}
      </DialogFooter>
    </>
  );
}
=======
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
>>>>>>> 6570c37c6c (feat(LWD): Signature screen (redesign send flow) (with placeholders screens))
