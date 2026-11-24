import React from "react";
import {
  ConnectKnownOrNewDeviceUIStateTypes,
  type ConnectKnownOrNewDeviceUIState,
  type DeviceListItem,
} from "@ledgerhq/live-dmk-mobile";
import {
  ConnectionErrorState,
  DiscoveryErrorState,
  ErrorBottomSheet,
  UnknownErrorState,
} from "LLM/components/DeviceConnection";
import { AddMode } from "./components/AddMode";
import type { DeviceRowItem } from "./components/DeviceRow";
import { DeviceSection } from "./components/DeviceSection";
import { DeviceStateSheet, type DeviceStateSheetState } from "./components/DeviceStateSheet";
import type {
  ConnectKnownOrNewDeviceErrorUIState,
  ConnectKnownOrNewDeviceViewProps,
} from "./types";
import { useConnectKnownOrNewDeviceTracking } from "./useConnectKnownOrNewDeviceTracking";
import { assertNever } from "./utils/assertNever";

const withoutActions = ({ key, device, connectivity, status }: DeviceListItem): DeviceListItem => ({
  key,
  device,
  connectivity,
  status,
});

type ListUIState = Exclude<
  ConnectKnownOrNewDeviceUIState,
  { type: typeof ConnectKnownOrNewDeviceUIStateTypes.ConnectNewDevice }
>;

type ListLayout = {
  devices: Array<DeviceRowItem>;
  onAddNewDevice?: () => void;
  disabled: boolean;
  deviceState: DeviceStateSheetState | null;
  errorState: ConnectKnownOrNewDeviceErrorUIState | null;
};

function getListLayout(state: ListUIState, keptDevices: Array<DeviceListItem>): ListLayout {
  switch (state.type) {
    case ConnectKnownOrNewDeviceUIStateTypes.Discovering:
      return state.isPaused
        ? { devices: state.devices, disabled: true, deviceState: null, errorState: null }
        : {
            devices: state.devices,
            onAddNewDevice: state.addNewDevice,
            disabled: false,
            deviceState: null,
            errorState: null,
          };
    case ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice:
    case ConnectKnownOrNewDeviceUIStateTypes.Connecting:
      return {
        devices: keptDevices.map(withoutActions),
        disabled: false,
        deviceState: state,
        errorState: null,
      };
    case ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError:
    case ConnectKnownOrNewDeviceUIStateTypes.ConnectionError:
    case ConnectKnownOrNewDeviceUIStateTypes.UnknownError:
      return {
        devices: keptDevices.map(withoutActions),
        disabled: false,
        deviceState: null,
        errorState: state,
      };
    default:
      return assertNever(state);
  }
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
  listFooter,
  children,
}: Readonly<ConnectKnownOrNewDeviceViewProps>): React.JSX.Element {
  useConnectKnownOrNewDeviceTracking(state);

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

  const { deviceState, errorState, ...listProps } = getListLayout(state, devices);

  return (
    <>
      <DeviceSection {...listProps} listFooter={listFooter}>
        {children}
      </DeviceSection>
      <DeviceStateSheet state={deviceState} />
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
