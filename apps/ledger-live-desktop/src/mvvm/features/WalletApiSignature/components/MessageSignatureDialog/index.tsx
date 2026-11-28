import React, { memo } from "react";
import { DeviceIntentExecutor } from "LLD/components/DeviceIntentExecutor";
import type { WalletApiDeviceIntentSignMessageRequest } from "./types";
import { useMessageSignatureDialogViewModel } from "./useMessageSignatureDialogViewModel";

export type { WalletApiDeviceIntentSignMessageRequest } from "./types";

type MessageSignatureDialogProps = Readonly<{
  request: WalletApiDeviceIntentSignMessageRequest;
  onClose: () => void;
}>;

const deviceConnectionParams = { acceptedDeviceModelIds: [] };

function MessageSignatureDialogComponent({
  request,
  onClose,
}: MessageSignatureDialogProps): React.ReactElement | null {
  const {
    sourceFlow,
    deviceInitializationInput,
    signatureIntent,
    analyticsProperties,
    onIntentJobStateChanged,
    onIntentJobComplete,
    onIntentJobError,
    onExecutorStateChanged,
    onUserCancel,
  } = useMessageSignatureDialogViewModel({ request, onClose });

  if (!deviceInitializationInput || !signatureIntent) {
    return null;
  }

  return (
    <DeviceIntentExecutor
      enabled
      sourceFlow={sourceFlow}
      analyticsProperties={analyticsProperties}
      deviceConnectionParams={deviceConnectionParams}
      deviceInitializationInput={deviceInitializationInput}
      intent={signatureIntent}
      intentComponentExtraProps={undefined}
      onExecutorStateChanged={onExecutorStateChanged}
      onIntentJobStateChanged={onIntentJobStateChanged}
      onIntentJobComplete={onIntentJobComplete}
      onIntentJobError={onIntentJobError}
      cancelIntentRequestId={undefined}
      onUserCancel={onUserCancel}
    />
  );
}

export const MessageSignatureDialog = memo(MessageSignatureDialogComponent);
