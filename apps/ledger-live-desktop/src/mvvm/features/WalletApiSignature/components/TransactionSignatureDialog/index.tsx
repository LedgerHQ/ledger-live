import React, { memo } from "react";
import { DeviceIntentExecutor } from "LLD/components/DeviceIntentExecutor";
import type { WalletApiDeviceIntentSignRequest } from "./types";
import { useTransactionSignatureDialogViewModel } from "./useTransactionSignatureDialogViewModel";

export type { WalletApiDeviceIntentSignRequest } from "./types";

type TransactionSignatureDialogProps = Readonly<{
  request: WalletApiDeviceIntentSignRequest;
  onClose: () => void;
}>;

const deviceConnectionParams = { acceptedDeviceModelIds: [] };

function TransactionSignatureDialogComponent({
  request,
  onClose,
}: TransactionSignatureDialogProps): React.ReactElement | null {
  const {
    deviceInitializationInput,
    signatureIntent,
    analyticsProperties,
    intentComponentExtraProps,
    onIntentJobStateChanged,
    onIntentJobComplete,
    onIntentJobError,
    onExecutorStateChanged,
    onUserCancel,
  } = useTransactionSignatureDialogViewModel({ request, onClose });

  if (!deviceInitializationInput || !signatureIntent) {
    return null;
  }

  return (
    <DeviceIntentExecutor
      enabled
      sourceFlow="wallet_api"
      analyticsProperties={analyticsProperties}
      deviceConnectionParams={deviceConnectionParams}
      deviceInitializationInput={deviceInitializationInput}
      intent={signatureIntent}
      intentComponentExtraProps={intentComponentExtraProps}
      onExecutorStateChanged={onExecutorStateChanged}
      onIntentJobStateChanged={onIntentJobStateChanged}
      onIntentJobComplete={onIntentJobComplete}
      onIntentJobError={onIntentJobError}
      cancelIntentRequestId={undefined}
      onUserCancel={onUserCancel}
    />
  );
}

export const TransactionSignatureDialog = memo(TransactionSignatureDialogComponent);
