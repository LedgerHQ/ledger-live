import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
import { DeviceIntentExecutor } from "LLM/components/DeviceIntentExecutor";
import { useMessageSignatureDrawerViewModel } from "./useMessageSignatureDrawerViewModel";
import type { WalletApiDeviceIntentSignMessageRequest } from "./types";

export type { WalletApiDeviceIntentSignMessageRequest } from "./types";

type Props = {
  request: WalletApiDeviceIntentSignMessageRequest;
  /** Dismiss the drawer (clears the pending request in the webview host). */
  onClose: () => void;
};

const deviceConnectionParams = { acceptedDeviceModelIds: [] };

/**
 * Hosts the wallet-api `message.sign` step (the Device Intent Executor and the bottom
 * sheet it owns) directly inside the webview subtree, so the drawer floats over the live
 * app instead of a dedicated full-screen navigation route.
 */
function MessageSignatureDrawer({ request, onClose }: Props) {
  const {
    sourceFlow,
    analyticsProperties,
    deviceInitializationInput,
    signatureIntent,
    onIntentJobStateChanged,
    onIntentJobComplete,
    onIntentJobError,
    onExecutorStateChanged,
    onUserCancel,
  } = useMessageSignatureDrawerViewModel({ request, onClose });

  if (!deviceInitializationInput || !signatureIntent) {
    return null;
  }

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="box-none"
      testID="wallet-api-message-signature-step"
    >
      <DeviceIntentExecutor
        enabled
        sourceFlow={sourceFlow}
        analyticsProperties={analyticsProperties}
        deviceConnectionParams={deviceConnectionParams}
        deviceInitializationInput={deviceInitializationInput}
        intent={signatureIntent}
        intentComponentExtraProps={undefined}
        onExecutorStateChanged={onExecutorStateChanged}
        onIntentJobStateChanged={onIntentJobStateChanged}
        onIntentJobComplete={onIntentJobComplete}
        onIntentJobError={onIntentJobError}
        cancelIntentRequestId={undefined}
        onUserCancel={onUserCancel}
      />
    </View>
  );
}

export default memo(MessageSignatureDrawer);
