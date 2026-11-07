import React from "react";
import { useTranslation } from "react-i18next";
import { DeviceIntentExecutor } from "LLD/components/DeviceIntentExecutor";
import { SignReviewDialog } from "../../components/SignReviewDialog";
import { CONNECTION_PARAMS, noop } from "../../utils/executorDefaults";
import type { useMessageSignViewModel } from "./useMessageSignViewModel";

type Props = ReturnType<typeof useMessageSignViewModel>;

export function MessageSignView({
  step,
  message,
  canConfirm,
  confirm,
  cancel,
  close,
  intent,
  initializationInput,
  onIntentJobError,
}: Props) {
  const { t } = useTranslation();

  if (step === "signing" && initializationInput) {
    return (
      <DeviceIntentExecutor
        enabled
        sourceFlow="wallet_api"
        deviceConnectionParams={CONNECTION_PARAMS}
        deviceInitializationInput={initializationInput}
        intent={intent}
        intentComponentExtraProps={undefined}
        onExecutorStateChanged={noop}
        onIntentJobComplete={close}
        onIntentJobError={onIntentJobError}
        cancelIntentRequestId={undefined}
        onUserCancel={cancel}
      />
    );
  }

  return (
    <SignReviewDialog
      title={t("platform.accountDataSign.message.title")}
      confirmLabel={t("platform.accountDataSign.confirm")}
      canConfirm={canConfirm}
      onConfirm={confirm}
      onCancel={cancel}
      testID="wallet-api-account-data-sign-message"
    >
      <span className="body-2 text-muted">
        {t("platform.accountDataSign.message.messageLabel")}
      </span>
      <pre
        className="body-2 max-h-256 overflow-auto rounded-md bg-muted p-12 text-base break-all whitespace-pre-wrap"
        data-testid="wallet-api-account-data-sign-message-content"
      >
        {message}
      </pre>
    </SignReviewDialog>
  );
}
