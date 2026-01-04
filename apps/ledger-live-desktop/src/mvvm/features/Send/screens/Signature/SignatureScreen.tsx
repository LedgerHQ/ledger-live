import React from "react";
import type { SignedOperation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import DeviceAction from "~/renderer/components/DeviceAction";
import { SimplifiedTransactionConfirm } from "./components/SimplifiedTransactionConfirm";
import { useSignatureViewModel } from "./hooks/useSignatureViewModel";
import { LockedDevicePrompt } from "./components/LockedDevicePrompt";
import { PendingState } from "./components/PendingState";

const Result = (
  props:
    | {
        signedOperation: SignedOperation | undefined | null;
        device: Device;
      }
    | {
        transactionSignError: Error;
      },
) => {
  if (!("signedOperation" in props)) {
    return null;
  }
  // Show pending state after signature during broadcast
  return <PendingState messageKey="send.steps.confirmation.pending.title" />;
};

export const SignatureScreen = () => {
  const { account, transaction, action, request, onDeviceActionResult, finishWithError } =
    useSignatureViewModel();

  if (!account || !transaction) {
    return null;
  }

  return (
    <div className="-mt-12 mb-24">
      <DeviceAction
        action={action}
        // @ts-expect-error This request type is not compatible with the action expected shape.
        request={request}
        Result={Result}
        onResult={onDeviceActionResult}
        onError={finishWithError}
        analyticsPropertyFlow="send"
        renderLockedDevice={({ device, onRetry }) =>
          device ? <LockedDevicePrompt deviceModelId={device.modelId} onRetry={onRetry} /> : null
        }
        renderDeviceSignatureRequested={({ device }) => (
          <SimplifiedTransactionConfirm device={device} />
        )}
      />
    </div>
  );
};
