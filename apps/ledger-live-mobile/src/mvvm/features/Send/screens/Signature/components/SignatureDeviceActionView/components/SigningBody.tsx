import React, { useEffect } from "react";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { SimplifiedTransactionConfirm } from "../../SimplifiedTransactionConfirm";
import { SignatureCancelledState } from "./SignatureCancelledState";
import { SignatureErrorState } from "./SignatureErrorState";
import { SigningLoader } from "./SigningLoader";

type SignatureDeviceActionViewModel = ReturnType<
  typeof import("../../../hooks/useSignatureDeviceActionViewModel").useSignatureDeviceActionViewModel
>;

type SigningBodyProps = Readonly<{
  device: Device;
  action: SignatureDeviceActionViewModel["action"];
  request: NonNullable<SignatureDeviceActionViewModel["request"]>;
  onResult: SignatureDeviceActionViewModel["onDeviceActionResultCompleted"];
  onClose: () => void;
}>;

export function SigningBody({ device, action, request, onResult, onClose }: SigningBodyProps) {
  const status = action.useHook(device, request);
  const payload = action.mapResult(status);

  const signedOperation =
    payload && "signedOperation" in payload ? payload.signedOperation : undefined;

  useEffect(() => {
    if (signedOperation) {
      onResult({ signedOperation, device });
    }
  }, [signedOperation, device, onResult]);

  const signError = status.transactionSignError ?? status.error ?? undefined;

  if (signError) {
    const isUserRefused =
      signError?.name === "UserRefusedOnDevice" || signError?.name === "TransactionRefusedOnDevice";

    return isUserRefused ? (
      <SignatureCancelledState onClose={onClose} onRetry={status.onRetry} />
    ) : (
      <SignatureErrorState error={signError} onClose={onClose} onRetry={status.onRetry} />
    );
  }

  // Broadcasting after signature, or the device confirmation is displayed on-device.
  if (signedOperation) {
    return <SigningLoader />;
  }

  if (status.deviceSignatureRequested) {
    return <SimplifiedTransactionConfirm deviceModelId={device.modelId} />;
  }

  // Connecting, opening the app or streaming the transaction to the device.
  return <SigningLoader />;
}
