import React from "react";
import type { SignTransactionIntentWithResultJobState } from "@ledgerhq/live-common/intents/signTransactionIntent";
import { ContinueOnDevice } from "LLD/components/DeviceIntentExecutor/components/DeviceGenericStates/ContinueOnDevice";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";
import { StakePositionProcessing } from "./StakePositionProcessing";
import type { StakePositionSignatureExtraProps } from "./types";

type Props = Readonly<{
  jobState: SignTransactionIntentWithResultJobState | undefined;
  extraProps: StakePositionSignatureExtraProps;
  onClose: () => void;
}>;

/**
 * The device step of the exit. A refusal or a failure ends it: the stake position dialog shows the
 * result instead.
 */
export function StakePositionSignatureComponentLWD({ jobState, extraProps }: Props) {
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
          <StakePositionProcessing testID="stake-position-signature-processing" />
        </>
      );
    case "cancelled":
    case "error":
      return null;
  }
}
