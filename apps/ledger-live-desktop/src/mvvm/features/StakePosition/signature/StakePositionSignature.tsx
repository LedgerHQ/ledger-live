import React from "react";
import type { DeviceConnectionParams } from "@features/platform-device-intent";
import type { SignTransactionIntentWithResultJobState } from "@ledgerhq/live-common/intents/signTransactionIntent";
import type { SignatureRequest } from "@ledgerhq/live-common/flows/send/hooks/useSendFlowSignatureCore";
import type { SignedOperation } from "@ledgerhq/types-live";
import { DeviceIntentExecutor } from "LLD/components/DeviceIntentExecutor";
import type { StakePositionSignatureExtraProps } from "./types";
import {
  useStakePositionSignatureViewModel,
  type StakePositionSignatureProps,
} from "./useStakePositionSignatureViewModel";

const deviceConnectionParams: DeviceConnectionParams = { acceptedDeviceModelIds: [] };

/** The device step of the exit, in the executor's own dialog over the stake position dialog. */
export function StakePositionSignature(props: StakePositionSignatureProps) {
  const {
    initializationInput,
    intent,
    extraProps,
    onIntentJobStateChanged,
    onIntentJobComplete,
    onExecutorStateChanged,
    onUserCancel,
  } = useStakePositionSignatureViewModel(props);

  if (!initializationInput) return null;

  return (
    <DeviceIntentExecutor<
      SignTransactionIntentWithResultJobState,
      SignatureRequest,
      StakePositionSignatureExtraProps,
      SignedOperation
    >
      enabled
      sourceFlow="earn"
      deviceConnectionParams={deviceConnectionParams}
      deviceInitializationInput={initializationInput}
      intent={intent}
      intentComponentExtraProps={extraProps}
      onExecutorStateChanged={onExecutorStateChanged}
      onIntentJobStateChanged={onIntentJobStateChanged}
      onIntentJobComplete={onIntentJobComplete}
      cancelIntentRequestId={undefined}
      onUserCancel={onUserCancel}
    />
  );
}
