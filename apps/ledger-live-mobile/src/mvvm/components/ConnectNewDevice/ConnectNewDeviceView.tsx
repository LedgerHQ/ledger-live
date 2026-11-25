import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { ConnectNewDeviceUIStateTypes } from "@ledgerhq/live-dmk-mobile";
import { getConnectDeviceSubError } from "@ledgerhq/live-dmk-shared";
import {
  ErrorBottomSheet,
  TrackedConnectionErrorState,
  TrackedDiscoveryErrorState,
  TrackedUnknownErrorState,
} from "LLM/components/DeviceConnection";
import { useDeviceIntentTracking } from "LLM/components/DeviceIntentExecutor/utils/DeviceIntentTrackingContext";
import {
  CONNECT_DEVICE_BUTTON,
  trackConnectDeviceButtonClicked,
} from "LLM/components/DeviceIntentExecutor/utils/trackDeviceIntent";
import { ConnectedView } from "./components/ConnectedView";
import { ConnectingView } from "./components/ConnectingView";
import { DiscoveringView } from "./components/DiscoveringView";
import type {
  ConnectNewDeviceErrorUIState,
  ConnectNewDeviceNonErrorUIState,
  ConnectNewDeviceViewProps,
} from "./types";
import { isErrorState } from "./utils/isErrorState";

function assertNever(value: never): never {
  throw new Error(`Unhandled connect new device state: ${JSON.stringify(value)}`);
}

function NonErrorStateView({
  state,
  isBehindErrorSheet,
  checkIsNewDevice,
  onDeviceNotFound,
}: Readonly<{
  state: ConnectNewDeviceNonErrorUIState;
  isBehindErrorSheet: boolean;
  checkIsNewDevice: ConnectNewDeviceViewProps["checkIsNewDevice"];
  onDeviceNotFound?: () => void;
}>): React.ReactNode {
  switch (state.type) {
    case ConnectNewDeviceUIStateTypes.Discovering:
      return (
        <DiscoveringView
          state={state}
          isBehindErrorSheet={isBehindErrorSheet}
          checkIsNewDevice={checkIsNewDevice}
          onDeviceNotFound={onDeviceNotFound}
        />
      );
    case ConnectNewDeviceUIStateTypes.Connecting:
      return (
        <ConnectingView
          state={state}
          isBehindErrorSheet={isBehindErrorSheet}
          isNewDevice={checkIsNewDevice(state.device)}
        />
      );
    case ConnectNewDeviceUIStateTypes.Connected:
    case ConnectNewDeviceUIStateTypes.Done:
      return (
        <ConnectedView
          state={state}
          isBehindErrorSheet={isBehindErrorSheet}
          isNewDevice={checkIsNewDevice(state.device)}
        />
      );
    case ConnectNewDeviceUIStateTypes.Terminated:
      return null;
    default:
      return assertNever(state);
  }
}

function ErrorStateView({
  state,
  platform,
  checkIsNewDevice,
}: Readonly<{
  state: ConnectNewDeviceErrorUIState;
  platform: ConnectNewDeviceViewProps["platform"];
  checkIsNewDevice: ConnectNewDeviceViewProps["checkIsNewDevice"];
}>): React.ReactNode {
  switch (state.type) {
    case ConnectNewDeviceUIStateTypes.DiscoveryError:
      return <TrackedDiscoveryErrorState state={state} platform={platform} />;
    case ConnectNewDeviceUIStateTypes.ConnectionError:
      return (
        <TrackedConnectionErrorState state={state} isNewDevice={checkIsNewDevice(state.device)} />
      );
    case ConnectNewDeviceUIStateTypes.UnknownError:
      return <TrackedUnknownErrorState state={state} />;
    default:
      return assertNever(state);
  }
}

export function ConnectNewDeviceView({
  state,
  lastNonErrorState,
  platform,
  onDeviceNotFound,
  onCloseErrorSheet,
  checkIsNewDevice,
}: Readonly<ConnectNewDeviceViewProps>) {
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();

  // An error shows in the sheet, over the last view before it.
  const nonErrorState = isErrorState(state) ? lastNonErrorState : state;
  const errorState = isErrorState(state) ? state : null;

  const onCloseButtonPressed = () => {
    if (!errorState || errorState.type === ConnectNewDeviceUIStateTypes.UnknownError) return;
    trackConnectDeviceButtonClicked({
      sourceFlow,
      button: CONNECT_DEVICE_BUTTON.Close,
      subError: getConnectDeviceSubError(errorState.error),
      extraProperties: analyticsProperties,
    });
  };

  return (
    <Box lx={{ flex: 1, backgroundColor: "canvas" }}>
      {/* The view under the error sheet sends its page again once the sheet closes. */}
      <NonErrorStateView
        state={nonErrorState}
        isBehindErrorSheet={errorState !== null}
        checkIsNewDevice={checkIsNewDevice}
        onDeviceNotFound={onDeviceNotFound}
      />
      <ErrorBottomSheet
        isOpen={errorState !== null}
        onClose={onCloseErrorSheet}
        onHeaderClosePressed={onCloseButtonPressed}
        testID="connect-new-device-error-sheet"
      >
        {errorState && (
          <ErrorStateView
            state={errorState}
            platform={platform}
            checkIsNewDevice={checkIsNewDevice}
          />
        )}
      </ErrorBottomSheet>
    </Box>
  );
}
