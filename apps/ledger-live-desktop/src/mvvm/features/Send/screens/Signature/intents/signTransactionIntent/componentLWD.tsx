import React from "react";
import { useTranslation } from "react-i18next";
import type { SignTransactionIntentWithResultJobState } from "@ledgerhq/live-common/intents/signTransactionIntent";
import { SignatureBroadcastPending } from "../../components/SignatureBroadcastPending";
import { SignatureCancelled } from "../../components/SignatureCancelled";
import { SignatureError } from "../../components/SignatureError";
import { SignatureLoading } from "../../components/SignatureLoading";
import { SimplifiedTransactionConfirm } from "../../components/SimplifiedTransactionConfirm";
import type { SignatureExtraProps } from "./types";

type SignTransactionIntentComponentLWDProps = Readonly<{
  jobState: SignTransactionIntentWithResultJobState | undefined;
  extraProps: SignatureExtraProps;
  onClose: () => void;
}>;

export function SignTransactionIntentComponentLWD({
  jobState,
  extraProps,
  onClose,
}: SignTransactionIntentComponentLWDProps) {
  const { t } = useTranslation();

  if (!jobState) {
    return null;
  }

  switch (jobState.type) {
    case "pending":
    case "device-signature-requested":
      return (
        <SimplifiedTransactionConfirm
          deviceModelId={jobState.deviceModelId}
          title={
            extraProps.sponsoredTransfer
              ? t("newSendFlow.sponsoredTransferSignature.title")
              : undefined
          }
          onShown={extraProps.onDeviceConfirmationShown}
        />
      );
    case "device-streaming":
    case "device-signature-granted":
      return <SignatureLoading title={t("newSendFlow.processingTransaction")} />;
    case "signed":
      return <SignatureBroadcastPending />;
    case "cancelled":
      return <SignatureCancelled onClose={onClose} onRetry={jobState.retry} />;
    case "error":
      return <SignatureError error={jobState.error} onClose={onClose} onRetry={jobState.retry} />;
    default:
      return assertNever(jobState);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled sign transaction intent state: ${String(value)}`);
}
