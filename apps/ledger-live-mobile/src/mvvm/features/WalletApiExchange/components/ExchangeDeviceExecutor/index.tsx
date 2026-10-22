import React from "react";
import { StyleSheet, View } from "react-native";
import { DeviceIntentExecutor } from "LLM/components/DeviceIntentExecutor";
import type { ExchangeSession } from "../../session";
import { useExchangeDeviceExecutorViewModel } from "./useExchangeDeviceExecutorViewModel";

type Props = Readonly<{
  session: ExchangeSession;
}>;

const deviceConnectionParams = { acceptedDeviceModelIds: [] };

/**
 * The Device Intent Executor of one exchange session. It stays mounted for every step of the
 * session: the session swaps the intent, without connecting the device again.
 */
export function ExchangeDeviceExecutor({ session }: Props) {
  const {
    sourceFlow,
    analyticsProperties,
    deviceInitializationInput,
    intent,
    onExecutorStateChanged,
    onIntentJobComplete,
    onIntentJobError,
    onUserCancel,
  } = useExchangeDeviceExecutorViewModel({ session });

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="box-none"
      testID="wallet-api-exchange-step"
    >
      <DeviceIntentExecutor
        enabled
        sourceFlow={sourceFlow}
        analyticsProperties={analyticsProperties}
        deviceConnectionParams={deviceConnectionParams}
        deviceInitializationInput={deviceInitializationInput}
        intent={intent}
        intentComponentExtraProps={undefined}
        onExecutorStateChanged={onExecutorStateChanged}
        onIntentJobComplete={onIntentJobComplete}
        onIntentJobError={onIntentJobError}
        cancelIntentRequestId={undefined}
        onUserCancel={onUserCancel}
      />
    </View>
  );
}
