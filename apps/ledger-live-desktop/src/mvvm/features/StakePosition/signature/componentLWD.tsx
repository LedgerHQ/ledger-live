import React from "react";
import type { SignTransactionIntentWithResultJobState } from "@ledgerhq/live-common/intents/signTransactionIntent";
import { UserRefusedOnDevice } from "LLD/components/DeviceIntentExecutor";
import { ContinueOnDevice } from "LLD/components/DeviceIntentExecutor/components/DeviceGenericStates/ContinueOnDevice";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";
import { StakePositionProcessing } from "./StakePositionProcessing";
import { StakePositionSignatureError } from "./StakePositionSignatureError";
import type { StakePositionSignatureExtraProps } from "./types";

type Props = Readonly<{
  jobState: SignTransactionIntentWithResultJobState | undefined;
  extraProps: StakePositionSignatureExtraProps;
  onClose: () => void;
}>;

/**
 * The device step of the exit. A refusal or a failure stays on it, with a retry of the signature
 * and a close that leaves the device step unsigned.
 */
export function StakePositionSignatureComponentLWD({ jobState, extraProps, onClose }: Props) {
  if (!jobState) return null;

  switch (jobState.type) {
    case "pending":
    case "device-signature-requested":
      return (
        <>
          <DeviceBlocker />
          <ContinueOnDevice
            deviceModelId={jobState.deviceModelId}
            deviceName={extraProps.deviceName}
            testID="stake-position-signature-continue"
          />
        </>
      );
    case "device-streaming":
    case "device-signature-granted":
    case "signed":
      return (
        <>
          <DeviceBlocker />
          <StakePositionProcessing
            action={extraProps.action}
            testID="stake-position-signature-processing"
          />
        </>
      );
    case "cancelled":
      return (
        <UserRefusedOnDevice
          onClose={onClose}
          onRetry={jobState.retry}
          testID="stake-position-signature-refused"
        />
      );
    case "error":
      return (
        <StakePositionSignatureError
          error={jobState.error}
          onClose={onClose}
          onRetry={jobState.retry}
        />
      );
  }
}
