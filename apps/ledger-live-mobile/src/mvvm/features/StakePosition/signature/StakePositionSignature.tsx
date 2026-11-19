import React from "react";
import type { DeviceConnectionParams } from "@features/platform-device-intent";
import type { SignatureRequest } from "@ledgerhq/live-common/flows/send/hooks/useSendFlowSignatureCore";
import type { SignTransactionIntentWithResultJobState } from "@ledgerhq/live-common/intents/signTransactionIntent";
import type { SignedOperation } from "@ledgerhq/types-live";
import { DeviceIntentExecutor } from "LLM/components/DeviceIntentExecutor";
import type { StakePositionSignatureExtraProps } from "./types";
import {
  useStakePositionSignatureViewModel,
  type StakePositionSignatureProps,
} from "./useStakePositionSignatureViewModel";

const deviceConnectionParams: DeviceConnectionParams = { acceptedDeviceModelIds: [] };
const noop = () => undefined;

/**
 * The device step of the exit, in the executor's own sheet. Only one sheet shows at a time: the
 * stake position sheet steps aside while it is open, and shows the result once it is gone.
 */
export function StakePositionSignature(props: StakePositionSignatureProps) {
  const {
    initializationInput,
    intent,
    extraProps,
    isOpen,
    onIntentJobStateChanged,
    onIntentJobComplete,
    onExecutorStateChanged,
    onUserCancel,
    onDismissed,
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
      onIntentJobError={noop}
      cancelIntentRequestId={undefined}
      onUserCancel={onUserCancel}
      isRequestingToBeOpened={isOpen}
      onDeviceSheetDismissed={onDismissed}
    />
  );
}
