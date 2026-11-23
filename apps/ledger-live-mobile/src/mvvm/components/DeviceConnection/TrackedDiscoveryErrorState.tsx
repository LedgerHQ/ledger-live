import React from "react";
import {
  BaseDiscoveryErrorTypes,
  DiscoveryErrorTypes,
  type DiscoveryError,
} from "@ledgerhq/live-dmk-mobile";
import type { AppPlatform } from "@ledgerhq/live-common/platform/types";
import { getConnectDeviceSubError, type DiscoveryErrorUIState } from "@ledgerhq/live-dmk-shared";
import { TrackDIEScreen } from "LLM/components/DeviceIntentExecutor/components/TrackDIEScreen";
import { useDeviceIntentTracking } from "LLM/components/DeviceIntentExecutor/utils/DeviceIntentTrackingContext";
import {
  CONNECT_DEVICE_BUTTON,
  getTrackingTransport,
  PAGE_CONNECT_DEVICE,
  trackConnectDeviceButtonClicked,
} from "LLM/components/DeviceIntentExecutor/utils/trackDeviceIntent";
import { DiscoveryErrorState } from "./DiscoveryErrorState";

type TrackedDiscoveryErrorStateProps = {
  state: DiscoveryErrorUIState<DiscoveryError>;
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

/** `DiscoveryErrorState` with its Connect Device page and button events. */
export function TrackedDiscoveryErrorState({
  state,
  platform,
}: Readonly<TrackedDiscoveryErrorStateProps>): React.ReactNode {
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();
  const trackingTransport = getTrackingTransport(state.error.transportId);
  const subError = getConnectDeviceSubError(state.error);
  const { retry, ignore } = state;

  const trackButtonClicked = (button: string) =>
    trackConnectDeviceButtonClicked({
      sourceFlow,
      button,
      subError,
      extraProperties: analyticsProperties,
    });

  return (
    <>
      <TrackDIEScreen
        category={PAGE_CONNECT_DEVICE.DiscoveryError}
        {...(trackingTransport ? { transport: trackingTransport } : {})}
        subError={subError}
        refreshSource
      />
      <DiscoveryErrorState
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
