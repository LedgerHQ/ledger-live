import React from "react";
import type { SignTransactionIntentWithResultJobState } from "@ledgerhq/live-common/intents/signTransactionIntent";
import type { SignatureRequest } from "@ledgerhq/live-common/flows/send/hooks/useSendFlowSignatureCore";
import type { SignedOperation } from "@ledgerhq/types-live";
import { DeviceIntentExecutor } from "LLD/components/DeviceIntentExecutor";
import type { SignatureExtraProps } from "./intents/signTransactionIntent/types";
import { useSignatureExecutorViewModel } from "./hooks/useSignatureExecutorViewModel";
import { SignatureBroadcastPending } from "./components/SignatureBroadcastPending";

const deviceConnectionParams = { acceptedDeviceModelIds: [] };

export const SignatureExecutorScreen = () => {
  const {
    account,
    transaction,
    request,
    deviceInitializationInput,
    signatureIntent,
    intentExtraProps,
    isSigned,
    onExecutorStateChanged,
    onIntentJobStateChanged,
    onIntentJobComplete,
    onUserCancel,
  } = useSignatureExecutorViewModel();

  if (!account || !transaction || !request || !deviceInitializationInput || !signatureIntent) {
    return null;
  }

  // Once signed, the executor must not stay mounted: a disconnect would offer a Retry that signs again.
  if (isSigned) {
    return (
      <div data-testid="send-signature-step">
        <SignatureBroadcastPending />
      </div>
    );
  }

  return (
    <div data-testid="send-signature-step">
      <DeviceIntentExecutor<
        SignTransactionIntentWithResultJobState,
        SignatureRequest,
        SignatureExtraProps,
        SignedOperation
      >
        enabled
        sourceFlow="send"
        deviceConnectionParams={deviceConnectionParams}
        deviceInitializationInput={deviceInitializationInput}
        intent={signatureIntent}
        intentComponentExtraProps={intentExtraProps}
        onExecutorStateChanged={onExecutorStateChanged}
        onIntentJobStateChanged={onIntentJobStateChanged}
        onIntentJobComplete={onIntentJobComplete}
        cancelIntentRequestId={undefined}
        onUserCancel={onUserCancel}
      />
    </div>
  );
};
