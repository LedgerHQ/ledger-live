import React from "react";
import { ConnectKnownOrNewDeviceUIStateTypes } from "@ledgerhq/live-dmk-mobile";
import {
  ConnectionErrorState,
  DiscoveryErrorState,
  ErrorBottomSheet,
  UnknownErrorState,
} from "LLM/components/DeviceConnection";
import { AddMode } from "./components/AddMode";
import { DeviceSection } from "./components/DeviceSection";
import type {
  ConnectKnownOrNewDeviceErrorUIState,
  ConnectKnownOrNewDeviceViewProps,
} from "./types";
import { isErrorState } from "./utils/isErrorState";

function assertNever(value: never): never {
  throw new Error(`Unhandled connect known or new device error: ${JSON.stringify(value)}`);
}

function ErrorStateView({
  state,
  platform,
}: Readonly<{
  state: ConnectKnownOrNewDeviceErrorUIState;
  platform: ConnectKnownOrNewDeviceViewProps["platform"];
}>): React.ReactNode {
  switch (state.type) {
    case ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError:
      return <DiscoveryErrorState state={state} platform={platform} />;
    case ConnectKnownOrNewDeviceUIStateTypes.ConnectionError:
      return <ConnectionErrorState state={state} />;
    case ConnectKnownOrNewDeviceUIStateTypes.UnknownError:
      return <UnknownErrorState />;
    default:
      return assertNever(state);
  }
}

export function ConnectKnownOrNewDeviceView({
  state,
  devices,
  addModeLastNonErrorState,
  platform,
  onDeviceNotFound,
  onCloseErrorSheet,
  onCloseAddModeErrorSheet,
  children,
}: Readonly<ConnectKnownOrNewDeviceViewProps>): React.JSX.Element {
  if (state.type === ConnectKnownOrNewDeviceUIStateTypes.ConnectNewDevice) {
    return (
      <AddMode
        state={state.connectNewDeviceUIState}
        lastNonErrorState={addModeLastNonErrorState}
        platform={platform}
        onDeviceNotFound={onDeviceNotFound}
        onCloseErrorSheet={onCloseAddModeErrorSheet}
        onClose={state.close}
      />
    );
  }

  const isDiscovering = state.type === ConnectKnownOrNewDeviceUIStateTypes.Discovering;
  const errorState = isErrorState(state) ? state : null;

  return (
    <>
      <DeviceSection
        devices={isDiscovering ? state.devices : devices}
        onAddNewDevice={isDiscovering ? state.addNewDevice : undefined}
      >
        {children}
      </DeviceSection>
      <ErrorBottomSheet
        isOpen={errorState !== null}
        onClose={onCloseErrorSheet}
        testID="connect-known-or-new-device-error-sheet"
      >
        {errorState && <ErrorStateView state={errorState} platform={platform} />}
      </ErrorBottomSheet>
    </>
  );
}
