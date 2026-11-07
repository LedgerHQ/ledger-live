import React from "react";
import { useTranslation } from "react-i18next";
import { DeviceIntentExecutor } from "LLD/components/DeviceIntentExecutor";
import { SignReviewDialog } from "../../components/SignReviewDialog";
import { CONNECTION_PARAMS, noop } from "../../utils/executorDefaults";
import type { useReceiveViewModel } from "./useReceiveViewModel";

type Props = ReturnType<typeof useReceiveViewModel>;

export function ReceiveView({
  step,
  address,
  intent,
  canConfirm,
  confirm,
  cancel,
  initializationInput,
  onIntentJobStateChanged,
  onIntentJobError,
}: Props) {
  const { t } = useTranslation();

  if (step === "signing" && intent && initializationInput) {
    return (
      <DeviceIntentExecutor
        enabled
        sourceFlow="wallet_api"
        deviceConnectionParams={CONNECTION_PARAMS}
        deviceInitializationInput={initializationInput}
        intent={intent}
        intentComponentExtraProps={undefined}
        onExecutorStateChanged={noop}
        onIntentJobStateChanged={onIntentJobStateChanged}
        onIntentJobError={onIntentJobError}
        cancelIntentRequestId={undefined}
        onUserCancel={cancel}
      />
    );
  }

  return (
    <SignReviewDialog
      title={t("platform.accountDataSign.receive.title")}
      confirmLabel={
        intent
          ? t("platform.accountDataSign.receive.verify")
          : t("platform.accountDataSign.receive.confirm")
      }
      canConfirm={canConfirm}
      onConfirm={confirm}
      onCancel={cancel}
      testID="wallet-api-account-data-receive"
    >
      <span className="body-2 text-muted">
        {t("platform.accountDataSign.receive.addressLabel")}
      </span>
      <span
        className="body-1-semi-bold rounded-md bg-muted p-12 text-base break-all"
        data-testid="wallet-api-account-data-receive-address"
      >
        {address}
      </span>
    </SignReviewDialog>
  );
}
