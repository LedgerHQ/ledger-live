import React, { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { DeviceIntentExecutorLWM } from "LLM/components/DeviceIntentExecutor";
import { useMessageSignatureDrawerViewModel } from "./useMessageSignatureDrawerViewModel";
import type { WalletApiDeviceIntentSignMessageRequest } from "./types";

export type { WalletApiDeviceIntentSignMessageRequest } from "./types";

type Props = {
  request: WalletApiDeviceIntentSignMessageRequest;
  /** Dismiss the drawer (clears the pending request in the webview host). */
  onClose: () => void;
};

const deviceConnectionParams = { acceptedDeviceModelIds: [] };
const noop = () => undefined;

/**
 * Hosts the wallet-api `message.sign` step (the Device Intent Executor and the bottom
 * sheet it owns) directly inside the webview subtree, so the drawer floats over the live
 * app instead of a dedicated full-screen navigation route.
 */
function MessageSignatureDrawer({ request, onClose }: Props) {
  const {
    deviceInitializationInput,
    signatureIntent,
    onIntentJobStateChanged,
    onIntentJobError,
    onUserCancel,
  } = useMessageSignatureDrawerViewModel({ request, onClose });

  const analyticsProperties = useMemo(
    () => ({ manifestId: request.manifestId, manifestName: request.manifestName }),
    [request.manifestId, request.manifestName],
  );

  if (!deviceInitializationInput || !signatureIntent) {
    return null;
  }

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="box-none"
      testID="wallet-api-message-signature-step"
    >
      <DeviceIntentExecutorLWM
        enabled
        sourceFlow="wallet_api"
        analyticsProperties={analyticsProperties}
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

export default memo(MessageSignatureDrawer);
