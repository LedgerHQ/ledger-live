import React from "react";
import {
  BaseDiscoveryErrorTypes,
  ConnectDeviceUIStateTypes,
  DiscoveryErrorTypes,
  type ConnectDeviceUIState,
  type DiscoveryError,
} from "@ledgerhq/live-dmk-mobile";
import type { AppPlatform } from "@ledgerhq/live-common/platform/types";
import { getConnectDeviceSubError } from "@ledgerhq/live-dmk-shared";
import { DiscoveryErrorState as DiscoveryErrorStateView } from "LLM/components/DeviceConnection";
import { TrackDIEScreen } from "../../components/TrackDIEScreen";
import { useDeviceIntentTracking } from "../../utils/DeviceIntentTrackingContext";
import {
  CONNECT_DEVICE_BUTTON,
  getTrackingTransport,
  PAGE_CONNECT_DEVICE,
  trackConnectDeviceButtonClicked,
} from "../../utils/trackDeviceIntent";

type DiscoveryErrorStateProps = {
  state: Extract<ConnectDeviceUIState, { type: typeof ConnectDeviceUIStateTypes.DiscoveryError }>;
  platform: Exclude<AppPlatform, "desktop">;
};

const retryButtons: Record<DiscoveryError["type"], string> = {
  [DiscoveryErrorTypes.BluetoothPermissionDeniedPromptable]: CONNECT_DEVICE_BUTTON.AllowBluetooth,
  [DiscoveryErrorTypes.BluetoothPermissionDeniedManualSettings]: CONNECT_DEVICE_BUTTON.OpenSettings,
  [DiscoveryErrorTypes.BluetoothPermissionUnauthorizedManualSettings]:
    CONNECT_DEVICE_BUTTON.OpenSettings,
  [DiscoveryErrorTypes.BluetoothDisabledPromptable]: CONNECT_DEVICE_BUTTON.TurnOnBluetooth,
  [DiscoveryErrorTypes.BluetoothDisabledManualAction]: CONNECT_DEVICE_BUTTON.OpenSettings,
  [DiscoveryErrorTypes.BluetoothStateUnknownCheckOnly]: CONNECT_DEVICE_BUTTON.Retry,
  [DiscoveryErrorTypes.BluetoothUnsupported]: CONNECT_DEVICE_BUTTON.Retry,
  [DiscoveryErrorTypes.LocationPermissionDeniedPromptable]: CONNECT_DEVICE_BUTTON.AllowLocation,
  [DiscoveryErrorTypes.LocationPermissionDeniedManualSettings]: CONNECT_DEVICE_BUTTON.OpenSettings,
  [DiscoveryErrorTypes.LocationDisabledPromptable]: CONNECT_DEVICE_BUTTON.TurnOnLocation,
  [DiscoveryErrorTypes.LocationDisabledManualAction]: CONNECT_DEVICE_BUTTON.OpenSettings,
  [DiscoveryErrorTypes.LocationServicePermissionMissing]: CONNECT_DEVICE_BUTTON.Retry,
  [BaseDiscoveryErrorTypes.Unknown]: CONNECT_DEVICE_BUTTON.Retry,
};

export function DiscoveryErrorState({
  state,
  platform,
}: Readonly<DiscoveryErrorStateProps>): React.ReactNode {
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();
  const trackingTransport = getTrackingTransport(state.error.transportId);
  const { retry, ignore } = state;

  const trackButtonClicked = (button: string) =>
    trackConnectDeviceButtonClicked({ sourceFlow, button, extraProperties: analyticsProperties });

  return (
    <>
      <TrackDIEScreen
        category={PAGE_CONNECT_DEVICE.DiscoveryError}
        {...(trackingTransport ? { transport: trackingTransport } : {})}
        subError={getConnectDeviceSubError(state.error)}
        refreshSource
      />
      <DiscoveryErrorStateView
        state={{
          ...state,
          retry: retry
            ? () => {
                trackButtonClicked(retryButtons[state.error.type]);
                retry();
              }
            : undefined,
          ignore: () => {
            trackButtonClicked(CONNECT_DEVICE_BUTTON.ContinueWithUsb);
            ignore();
          },
        }}
        platform={platform}
      />
    </>
  );
}
