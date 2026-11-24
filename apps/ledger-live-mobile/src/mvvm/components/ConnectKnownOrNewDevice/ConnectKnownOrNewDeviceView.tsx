import React from "react";
import {
  ConnectKnownOrNewDeviceUIStateTypes,
  type ConnectKnownOrNewDeviceUIState,
  type DeviceListItem,
} from "@ledgerhq/live-dmk-mobile";
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
import { AddMode } from "./components/AddMode";
import type { DeviceRowItem } from "./components/DeviceRow";
import { DeviceSection } from "./components/DeviceSection";
import { DeviceStateSheet, type DeviceStateSheetState } from "./components/DeviceStateSheet";
import type {
  ConnectKnownOrNewDeviceErrorUIState,
  ConnectKnownOrNewDeviceViewProps,
} from "./types";
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
  isNewDevice,
}: Readonly<{
  state: ConnectKnownOrNewDeviceErrorUIState;
  platform: ConnectKnownOrNewDeviceViewProps["platform"];
  isNewDevice: ConnectKnownOrNewDeviceViewProps["isNewDevice"];
}>): React.ReactNode {
  switch (state.type) {
    case ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError:
      return <TrackedDiscoveryErrorState state={state} platform={platform} />;
    case ConnectKnownOrNewDeviceUIStateTypes.ConnectionError:
      return <TrackedConnectionErrorState state={state} isNewDevice={isNewDevice(state.device)} />;
    case ConnectKnownOrNewDeviceUIStateTypes.UnknownError:
      return <TrackedUnknownErrorState state={state} />;
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
  onCloseDeviceStateSheet,
  onCloseAddModeErrorSheet,
  isNewDevice,
  listFooter,
  children,
}: Readonly<ConnectKnownOrNewDeviceViewProps>): React.JSX.Element {
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();

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

  const onCloseButtonPressed = () => {
    if (!errorState || errorState.type === ConnectKnownOrNewDeviceUIStateTypes.UnknownError) return;
    trackConnectDeviceButtonClicked({
      sourceFlow,
      button: CONNECT_DEVICE_BUTTON.Close,
      subError: getConnectDeviceSubError(errorState.error),
      extraProperties: analyticsProperties,
    });
  };

  return (
    <>
      <DeviceSection {...listProps} isNewDevice={isNewDevice} listFooter={listFooter}>
        {children}
      </DeviceSection>
      <DeviceStateSheet
        state={deviceState}
        isNewDevice={isNewDevice}
        onClose={onCloseDeviceStateSheet}
      />
      <ErrorBottomSheet
        isOpen={errorState !== null}
        onClose={onCloseErrorSheet}
        onHeaderClosePressed={onCloseButtonPressed}
        testID="connect-known-or-new-device-error-sheet"
      >
        {errorState && (
          <ErrorStateView state={errorState} platform={platform} isNewDevice={isNewDevice} />
        )}
      </ErrorBottomSheet>
    </>
  );
}
