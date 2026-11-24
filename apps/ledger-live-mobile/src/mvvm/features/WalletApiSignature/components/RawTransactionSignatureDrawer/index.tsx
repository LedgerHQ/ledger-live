import React, { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { DeviceIntentExecutor } from "LLM/components/DeviceIntentExecutor";
import { useRawTransactionSignatureDrawerViewModel } from "./useRawTransactionSignatureDrawerViewModel";
import type { WalletApiDeviceIntentSignRawRequest } from "./types";

export type { WalletApiDeviceIntentSignRawRequest } from "./types";

type Props = {
  request: WalletApiDeviceIntentSignRawRequest;
  /** Dismiss the drawer (clears the pending request in the webview host). */
  onClose: () => void;
};

const deviceConnectionParams = { acceptedDeviceModelIds: [] };
const noop = () => undefined;

/**
 * Hosts the wallet-api raw signature step (the Device Intent Executor and the bottom sheet
 * it owns) inside the webview subtree, so the drawer floats over the live app.
 */
function RawTransactionSignatureDrawer({ request, onClose }: Props) {
  const {
    sourceFlow,
    deviceInitializationInput,
    signatureIntent,
    onIntentJobStateChanged,
    onIntentJobError,
    onExecutorStateChanged,
    onUserCancel,
  } = useRawTransactionSignatureDrawerViewModel({ request, onClose });

  const analyticsProperties = useMemo(
    () => ({ manifestId: request.manifestId, manifestName: request.manifestName }),
    [request.manifestId, request.manifestName],
  );

  // A raw transaction has no decoded recipient: the terms footer resolves from the manifest.
  const intentComponentExtraProps = useMemo(
    () => ({ manifestId: request.manifestId, manifestName: request.manifestName }),
    [request.manifestId, request.manifestName],
  );

  if (!deviceInitializationInput) {
    return null;
  }

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="box-none"
      testID="wallet-api-raw-signature-step"
    >
      <DeviceIntentExecutor
        enabled
        sourceFlow={sourceFlow}
        analyticsProperties={analyticsProperties}
        deviceConnectionParams={deviceConnectionParams}
        deviceInitializationInput={deviceInitializationInput}
        intent={signatureIntent}
        intentComponentExtraProps={intentComponentExtraProps}
        onExecutorStateChanged={onExecutorStateChanged}
        onIntentJobStateChanged={onIntentJobStateChanged}
        onIntentJobComplete={noop}
        onIntentJobError={onIntentJobError}
        cancelIntentRequestId={undefined}
        onUserCancel={onUserCancel}
      />
    </View>
  );
}

export default memo(RawTransactionSignatureDrawer);
