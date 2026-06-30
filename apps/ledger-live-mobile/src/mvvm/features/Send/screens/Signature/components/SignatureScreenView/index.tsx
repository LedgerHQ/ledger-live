import React from "react";
import { View } from "react-native";
import {
  DeviceIntentExecutorLWM,
  type InitializationInput,
} from "LLM/components/DeviceIntentExecutor";
import type {
  SignTransactionIntent,
  SignTransactionIntentJobState,
} from "@ledgerhq/live-common/intents/signTransactionIntent";

const deviceConnectionParams = { acceptedDeviceModelIds: [] };
const noop = () => undefined;

export type SignatureScreenViewProps = Readonly<{
  deviceInitializationInput: InitializationInput;
  signatureIntent: SignTransactionIntent;
  onIntentJobStateChanged: (jobState: SignTransactionIntentJobState) => void;
  onIntentJobError: (error: unknown) => void;
  onUserCancel: () => void;
}>;

export function SignatureScreenView({
  deviceInitializationInput,
  signatureIntent,
  onIntentJobStateChanged,
  onIntentJobError,
  onUserCancel,
}: SignatureScreenViewProps) {
  return (
    <View style={{ flex: 1 }} testID="send-signature-step">
      <DeviceIntentExecutorLWM
        enabled
        sourceFlow="send"
        deviceConnectionParams={deviceConnectionParams}
        deviceInitializationInput={deviceInitializationInput}
        intent={signatureIntent}
        intentComponentExtraProps={undefined}
        onExecutorStateChanged={noop}
        onIntentJobStateChanged={onIntentJobStateChanged}
        onIntentJobComplete={noop}
        onIntentJobError={onIntentJobError}
        cancelIntentRequestId={undefined}
        onUserCancel={onUserCancel}
      />
    </View>
  );
}
