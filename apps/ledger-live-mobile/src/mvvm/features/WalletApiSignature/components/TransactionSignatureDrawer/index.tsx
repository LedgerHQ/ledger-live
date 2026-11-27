import React, { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { DeviceIntentExecutor } from "LLM/components/DeviceIntentExecutor";
import { FeeSelectionStep } from "../FeeSelectionStep";
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
 * Hosts the wallet-api signature steps (the optional fee step, then the Device Intent Executor
 * and the bottom sheet it owns) directly inside the webview subtree, so the drawer floats over
 * the live app instead of a dedicated full-screen navigation route.
 */
function TransactionSignatureDrawer({ request, onClose }: Props) {
  const {
    sourceFlow,
    feeStep,
    isDeviceStep,
    deviceInitializationInput,
    signatureIntent,
    onIntentJobStateChanged,
    onIntentJobError,
    onExecutorStateChanged,
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

  const isDeviceStepReady = isDeviceStep && !!deviceInitializationInput && !!signatureIntent;

  if (!feeStep && !isDeviceStepReady) {
    return null;
  }

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="box-none"
      testID="wallet-api-signature-step"
    >
      {feeStep ? <FeeSelectionStep {...feeStep} /> : null}
      {isDeviceStep && deviceInitializationInput && signatureIntent ? (
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
      ) : null}
    </View>
  );
}

export default memo(TransactionSignatureDrawer);
