import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
import type { PerpsSignRequest } from "@ledgerhq/live-common/wallet-api/Perps/server";
import { HYPERLIQUID_DEVICE_CONNECTION_PARAMS } from "@features/platform-intent-hyperliquid-sign";
import { DeviceIntentExecutor } from "LLM/components/DeviceIntentExecutor";
import { usePerpsSignDrawerViewModel } from "./usePerpsSignDrawerViewModel";

type Props = Readonly<{
  request: PerpsSignRequest;
  manifestId: string;
  manifestName: string;
  isOpen: boolean;
  onClose: () => void;
  onDismissed: () => void;
}>;

const noop = () => undefined;

function PerpsSignDrawer({
  request,
  manifestId,
  manifestName,
  isOpen,
  onClose,
  onDismissed,
}: Props) {
  const {
    analyticsProperties,
    deviceInitializationInput,
    intent,
    onIntentJobComplete,
    onUserCancel,
  } = usePerpsSignDrawerViewModel({
    request,
    manifestId,
    manifestName,
    isOpen,
    onClose,
    onDismissed,
  });

  if (!deviceInitializationInput) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none" testID="perps-sign-drawer">
      <DeviceIntentExecutor
        enabled
        isRequestingToBeOpened={isOpen}
        onDeviceSheetDismissed={onDismissed}
        sourceFlow="wallet_api"
        analyticsProperties={analyticsProperties}
        deviceConnectionParams={HYPERLIQUID_DEVICE_CONNECTION_PARAMS}
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
