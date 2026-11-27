import React from "react";
import type { ConnectionError } from "@ledgerhq/live-dmk-mobile";
import { getConnectDeviceSubError, type ConnectionErrorUIState } from "@ledgerhq/live-dmk-shared";
import { TrackDIEScreen } from "LLM/components/DeviceIntentExecutor/components/TrackDIEScreen";
import { useDeviceIntentTracking } from "LLM/components/DeviceIntentExecutor/utils/DeviceIntentTrackingContext";
import {
  CONNECT_DEVICE_BUTTON,
  getTrackingTransport,
  PAGE_CONNECT_DEVICE,
  trackConnectDeviceButtonClicked,
} from "LLM/components/DeviceIntentExecutor/utils/trackDeviceIntent";
import { ConnectionErrorState } from "./ConnectionErrorState";

type TrackedConnectionErrorStateProps = {
  state: ConnectionErrorUIState<ConnectionError>;
  /** Sent with the page when the flow knows it. The DIE does not send it. */
  isNewDevice?: boolean;
};

/** `ConnectionErrorState` with its Connect Device page and button events. */
export function TrackedConnectionErrorState({
  state,
  isNewDevice,
}: Readonly<TrackedConnectionErrorStateProps>): React.ReactNode {
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();
  const subError = getConnectDeviceSubError(state.error);
  const { retry } = state;

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
        category={PAGE_CONNECT_DEVICE.ConnectionError}
        modelId={state.device.deviceModelId}
        transport={getTrackingTransport(state.device.transport)}
        {...(isNewDevice === undefined ? {} : { isNewDevice })}
        subError={subError}
        refreshSource
      />
      <ConnectionErrorState
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
