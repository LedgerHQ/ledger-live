import { useCallback, useEffect, useRef, useState } from "react";
import type {
  DeviceConnectionComponentParams,
  DeviceConnectionResult,
} from "@features/platform-device-intent";
import { dmkToLedgerDeviceIdMap, useDeviceIntentTracking } from "@ledgerhq/live-dmk-shared";
import {
  connectDevice,
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
  webHidTransportIdentifier,
  useDeviceManagementKit,
} from "@ledgerhq/live-dmk-desktop";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useLazyOnboardingActions } from "LLD/hooks/useLazyOnboardingActions";
import { addNewDeviceModel } from "~/renderer/actions/settings";
import { knownDevicesSelector } from "~/renderer/reducers/knownDevices";
import {
  trackDeviceConnected,
  trackDeviceConnecting,
  trackDevicePrompted,
} from "../utils/trackDeviceIntent";

const missingDeviceManagementKitError = new Error("Device Management Kit is not available");

type UseDeviceConnectionComponentLWDViewModelParams = {
  deviceConnectionParams: DeviceConnectionComponentParams;
  onConnected: (connectionResult: DeviceConnectionResult) => void;
};

export type DeviceConnectionComponentLWDViewModel = {
  state: ConnectDeviceUIState;
  onConnectLedgerDevice: () => void;
  onBuyLedgerDevice: () => void;
};

export function useDeviceConnectionComponentLWDViewModel({
  deviceConnectionParams,
  onConnected,
}: UseDeviceConnectionComponentLWDViewModelParams): DeviceConnectionComponentLWDViewModel {
  const dispatch = useDispatch();
  const dmk = useDeviceManagementKit();
  const knownDevices = useSelector(knownDevicesSelector);
  // Plugging in a device updates knownDevices while connecting. Keep the initial value so that
  // the update cannot restart dmk.connect and race the active WebHID connection.
  const knownDevicesRef = useRef(knownDevices);
  const { handleConnect, handleBuyDevice } = useLazyOnboardingActions();
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();
  const [state, setState] = useState<ConnectDeviceUIState>({
    type: ConnectDeviceUIStateTypes.Loading,
  });
  const firedRef = useRef({
    prompted: false,
    connecting: false,
  });

  useEffect(() => {
    switch (state.type) {
      case ConnectDeviceUIStateTypes.Discovering:
      case ConnectDeviceUIStateTypes.WaitingForSelectedDevice:
        if (firedRef.current.prompted) return;
        firedRef.current.prompted = true;
        trackDevicePrompted({ sourceFlow, extraProperties: analyticsProperties });
        return;
      case ConnectDeviceUIStateTypes.Connecting:
        if (firedRef.current.connecting) return;
        firedRef.current.connecting = true;
        trackDeviceConnecting({
          sourceFlow,
          modelId: state.device.deviceModelId,
          transport: state.device.transport === webHidTransportIdentifier ? "usb" : "ble",
          extraProperties: analyticsProperties,
        });
    }
  }, [analyticsProperties, sourceFlow, state]);

  const wrappedOnConnected = useCallback(
    (result: DeviceConnectionResult) => {
      const modelId = dmkToLedgerDeviceIdMap[result.connectedDevice.modelId];
      const transport = result.connectedDevice.type === "USB" ? "usb" : "ble";

      trackDeviceConnected({
        sourceFlow,
        modelId,
        transport,
        extraProperties: analyticsProperties,
      });

      dispatch(addNewDeviceModel({ deviceModelId: modelId }));

      onConnected(result);
    },
    [analyticsProperties, dispatch, onConnected, sourceFlow],
  );

  useEffect(() => {
    if (!dmk) {
      setState({
        type: ConnectDeviceUIStateTypes.UnknownError,
        error: missingDeviceManagementKitError,
      });
      return;
    }

    const subscription = connectDevice({
      knownDevices: knownDevicesRef.current,
      acceptedDeviceModelIds: deviceConnectionParams.acceptedDeviceModelIds.map(
        deviceModelId => dmkToLedgerDeviceIdMap[deviceModelId],
      ),
      disableAutoConnect: deviceConnectionParams.disableAutoConnect,
      dmk,
      onConnected: wrappedOnConnected,
    }).subscribe({
      next: nextState => {
        setState(nextState);
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [
    deviceConnectionParams.acceptedDeviceModelIds,
    deviceConnectionParams.disableAutoConnect,
    dmk,
    wrappedOnConnected,
  ]);

  return {
    state,
    onConnectLedgerDevice: handleConnect,
    onBuyLedgerDevice: handleBuyDevice,
  };
}
