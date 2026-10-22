import React from "react";
import { ConnectDeviceUIStateTypes, type ConnectDeviceUIState } from "@ledgerhq/live-dmk-mobile";
import { getConnectDeviceSubError } from "@ledgerhq/live-dmk-shared";
import { ConnectionErrorState as ConnectionErrorStateView } from "LLM/components/DeviceConnection";
import { TrackDIEScreen } from "../../components/TrackDIEScreen";
import { useDeviceIntentTracking } from "../../utils/DeviceIntentTrackingContext";
import {
  CONNECT_DEVICE_BUTTON,
  getTrackingTransport,
  PAGE_CONNECT_DEVICE,
  trackConnectDeviceButtonClicked,
} from "../../utils/trackDeviceIntent";

type ConnectionErrorStateProps = {
  state: Extract<ConnectDeviceUIState, { type: typeof ConnectDeviceUIStateTypes.ConnectionError }>;
};

export function ConnectionErrorState({
  state,
}: Readonly<ConnectionErrorStateProps>): React.ReactNode {
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();
  const { retry } = state;

  const trackButtonClicked = (button: string) =>
    trackConnectDeviceButtonClicked({ sourceFlow, button, extraProperties: analyticsProperties });

  return (
    <>
      <TrackDIEScreen
        category={PAGE_CONNECT_DEVICE.ConnectionError}
        modelId={state.device.deviceModelId}
        transport={getTrackingTransport(state.device.transport)}
        subError={getConnectDeviceSubError(state.error)}
        refreshSource
      />
      <ConnectionErrorStateView
        state={{
          ...state,
          retry: () => {
            trackButtonClicked(CONNECT_DEVICE_BUTTON.Retry);
            retry();
          },
        }}
        onHelpPress={() => trackButtonClicked(CONNECT_DEVICE_BUTTON.GetHelp)}
      />
    </>
  );
}
