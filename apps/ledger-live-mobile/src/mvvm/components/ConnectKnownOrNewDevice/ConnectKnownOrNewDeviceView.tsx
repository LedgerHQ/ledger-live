import React from "react";
import {
  ConnectKnownOrNewDeviceUIStateTypes,
  type ConnectKnownOrNewDeviceUIState,
  type DeviceListItem,
} from "@ledgerhq/live-dmk-mobile";
import { getConnectDeviceSubError, getConnectivityErrorFailure } from "@ledgerhq/live-dmk-shared";
import {
  ErrorBottomSheet,
  TrackedConnectionErrorState,
  TrackedDiscoveryErrorState,
  TrackedUnknownErrorState,
  useIsNewDevice,
} from "LLM/components/DeviceConnection";
import { useDeviceIntentTracking } from "LLM/components/DeviceIntentExecutor/utils/DeviceIntentTrackingContext";
import {
  CONNECT_DEVICE_BUTTON,
  getTrackingTransport,
  trackConnectDeviceButtonClicked,
  trackDeviceflowCanceled,
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
}: Readonly<{
  state: ConnectKnownOrNewDeviceErrorUIState;
  platform: ConnectKnownOrNewDeviceViewProps["platform"];
}>): React.ReactNode {
  const isNewDevice = useIsNewDevice();

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
  onCloseAddModeErrorSheet,
  listFooter,
  children,
}: Readonly<ConnectKnownOrNewDeviceViewProps>): React.JSX.Element {
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();

  const trackCloseClicked = (subError?: string) =>
    trackConnectDeviceButtonClicked({
      sourceFlow,
      button: CONNECT_DEVICE_BUTTON.Close,
      subError,
      extraProperties: analyticsProperties,
    });

  if (state.type === ConnectKnownOrNewDeviceUIStateTypes.ConnectNewDevice) {
    const { close } = state;
    // The Add mode sends its own outcome when it unmounts.
    const onCloseAddMode = () => {
      trackCloseClicked();
      close();
    };

    return (
      <AddMode
        state={state.connectNewDeviceUIState}
        lastNonErrorState={addModeLastNonErrorState}
        platform={platform}
        onDeviceNotFound={onDeviceNotFound}
        onCloseErrorSheet={onCloseAddModeErrorSheet}
        onClose={onCloseAddMode}
      />
    );
  }

  const { deviceState, errorState, ...listProps } = getListLayout(state, devices);

  const onCloseSheet = () => {
    // The sheet also reports a close once the state has left the error: no click then.
    if (errorState) {
      if (errorState.type !== ConnectKnownOrNewDeviceUIStateTypes.UnknownError) {
        trackCloseClicked(getConnectDeviceSubError(errorState.error));
      }
      trackDeviceflowCanceled({
        sourceFlow,
        extraProperties: analyticsProperties,
        failure: getConnectivityErrorFailure(errorState, getTrackingTransport),
      });
    }
    onCloseErrorSheet();
  };

  return (
    <>
      <DeviceSection {...listProps} listFooter={listFooter}>
        {children}
      </DeviceSection>
      <DeviceStateSheet state={deviceState} />
      <ErrorBottomSheet
        isOpen={errorState !== null}
        onClose={onCloseSheet}
        testID="connect-known-or-new-device-error-sheet"
      >
        {errorState && <ErrorStateView state={errorState} platform={platform} />}
      </ErrorBottomSheet>
    </>
  );
}
