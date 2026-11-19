import React from "react";
import type { SignTransactionIntentWithResultJobState } from "@ledgerhq/live-common/intents/signTransactionIntent";
import ModalLock from "~/components/ModalLock";
import PreventNativeBack from "~/components/PreventNativeBack";
import { ContinueOnDevice } from "LLM/components/DeviceIntentExecutor/components/DeviceGenericStates/ContinueOnDevice";
import { StakePositionProcessing } from "./StakePositionProcessing";
import type { StakePositionSignatureExtraProps } from "./types";

type Props = Readonly<{
  jobState: SignTransactionIntentWithResultJobState | undefined;
  extraProps: StakePositionSignatureExtraProps;
  onClose: () => void;
}>;

/**
 * The device step of the exit. A refusal or a failure ends it: the stake position sheet shows the
 * result instead.
 */
export function StakePositionSignatureComponentLWM({ jobState, extraProps }: Props) {
  if (!jobState) return null;

  switch (jobState.type) {
    case "pending":
    case "device-signature-requested":
      return (
        <>
          <ModalLock />
          <PreventNativeBack />
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
          <ModalLock />
          <PreventNativeBack />
          <StakePositionProcessing testID="stake-position-signature-processing" />
        </>
      );
    case "cancelled":
    case "error":
      return null;
  }
}
