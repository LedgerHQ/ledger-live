import React, { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { DeviceIntentExecutorLWM } from "LLM/components/DeviceIntentExecutor";
import { useTransactionSignatureDrawerViewModel } from "./useTransactionSignatureDrawerViewModel";
import type { WalletApiDeviceIntentSignRequest } from "./types";

export type { WalletApiDeviceIntentSignRequest } from "./types";

type Props = {
  request: WalletApiDeviceIntentSignRequest;
  /** Dismiss the drawer (clears the pending request in the webview host). */
  onClose: () => void;
};

const deviceConnectionParams = { acceptedDeviceModelIds: [] };
const noop = () => undefined;

/**
 * Hosts the wallet-api signature step (the Device Intent Executor and the bottom sheet
 * it owns) directly inside the webview subtree, so the drawer floats over the live app
 * instead of a dedicated full-screen navigation route.
 */
function TransactionSignatureDrawer({ request, onClose }: Props) {
  const {
    deviceInitializationInput,
    signatureIntent,
    onIntentJobStateChanged,
    onIntentJobError,
    onUserCancel,
  } = useTransactionSignatureDrawerViewModel({ request, onClose });

  const analyticsProperties = useMemo(
    () => ({ manifestId: request.manifestId, manifestName: request.manifestName }),
    [request.manifestId, request.manifestName],
  );

  const intentComponentExtraProps = useMemo(
    () => ({
      manifestId: request.manifestId,
      manifestName: request.manifestName,
      recipient: request.transaction.recipient,
    }),
    [request.manifestId, request.manifestName, request.transaction.recipient],
  );

  if (!deviceInitializationInput || !signatureIntent) {
    return null;
  }

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="box-none"
      testID="wallet-api-signature-step"
    >
      <DeviceIntentExecutorLWM
        enabled
        sourceFlow="wallet_api"
        analyticsProperties={analyticsProperties}
        deviceConnectionParams={deviceConnectionParams}
        deviceInitializationInput={deviceInitializationInput}
        intent={signatureIntent}
        intentComponentExtraProps={intentComponentExtraProps}
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

export default memo(TransactionSignatureDrawer);
