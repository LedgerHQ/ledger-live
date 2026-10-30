import React, { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import type { PerpsSignRequest } from "@ledgerhq/live-common/wallet-api/Perps/server";
import { DeviceIntentExecutor } from "LLM/components/DeviceIntentExecutor";
import { usePerpsSignDrawerViewModel } from "./usePerpsSignDrawerViewModel";

type Props = Readonly<{
  request: PerpsSignRequest;
  manifestId: string;
  manifestName: string;
  /** Dismiss the drawer (clears the pending request in the webview host). */
  onClose: () => void;
}>;

const deviceConnectionParams = { acceptedDeviceModelIds: [] };
const noop = () => undefined;

/**
 * Hosts the Perps action signing (the Device Intent Executor and the bottom sheet it owns)
 * inside the webview subtree, so the drawer floats over the live app.
 */
function PerpsSignDrawer({ request, manifestId, manifestName, onClose }: Props) {
  const { deviceInitializationInput, intent, onIntentJobComplete, onUserCancel } =
    usePerpsSignDrawerViewModel({ request, onClose });

  const analyticsProperties = useMemo(
    () => ({ manifestId, manifestName }),
    [manifestId, manifestName],
  );

  if (!deviceInitializationInput) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none" testID="perps-sign-drawer">
      <DeviceIntentExecutor
        enabled
        sourceFlow="wallet_api"
        analyticsProperties={analyticsProperties}
        deviceConnectionParams={deviceConnectionParams}
        deviceInitializationInput={deviceInitializationInput}
        intent={intent}
        intentComponentExtraProps={undefined}
        onExecutorStateChanged={noop}
        onIntentJobComplete={onIntentJobComplete}
        cancelIntentRequestId={undefined}
        onUserCancel={onUserCancel}
      />
    </View>
  );
}

export default memo(PerpsSignDrawer);
