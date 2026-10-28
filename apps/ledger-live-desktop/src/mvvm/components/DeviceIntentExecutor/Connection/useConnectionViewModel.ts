import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  DeviceConnectionParams,
  DeviceConnectionResult,
} from "@features/platform-device-intent";
import {
  dmkToLedgerDeviceIdMap,
  getConnectDeviceFailure,
  useDeviceIntentTracking,
  type KnownDevice,
} from "@ledgerhq/live-dmk-shared";
import {
  connectDevice,
  isBluetoothDevice,
  isBluetoothTransportEnabled,
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
  webHidTransportIdentifier,
  useDeviceManagementKit,
} from "@ledgerhq/live-dmk-desktop";
import { getEnv } from "@shared/env";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useLazyOnboardingActions } from "LLD/hooks/useLazyOnboardingActions";
import { addNewDeviceModel } from "~/renderer/actions/settings";
import { knownDevicesSelector } from "~/renderer/reducers/knownDevices";
import { canConnectWithBluetooth } from "~/renderer/components/Bluetooth/canConnectWithBluetooth";
import {
  useConnectBluetooth,
  type BluetoothConnectionStatus,
} from "~/renderer/components/Bluetooth/useConnectBluetooth";
import {
  getTrackingTransport,
  trackDeviceConnected,
  trackDeviceConnecting,
  trackDevicePrompted,
} from "../utils/trackDeviceIntent";

type UseConnectionViewModelParams = {
  deviceConnectionParams: DeviceConnectionParams;
  onConnected: (connectionResult: DeviceConnectionResult) => void;
};

export type ConnectionBluetoothViewModel = {
  status: BluetoothConnectionStatus;
  onConnect: () => void;
};

export type ConnectionViewModel = {
  state: ConnectDeviceUIState;
  onConnectLedgerDevice: () => void;
  onBuyLedgerDevice: () => void;
  /** `null` when Bluetooth is disabled or no accepted model supports it. */
  bluetooth: ConnectionBluetoothViewModel | null;
};

export function useConnectionViewModel({
  deviceConnectionParams,
  onConnected,
}: UseConnectionViewModelParams): ConnectionViewModel {
  const dispatch = useDispatch();
  const dmk = useDeviceManagementKit();
  // Plugging in a device updates knownDevices while connecting. Keep the initial value so that
  // the update cannot restart dmk.connect and race the active WebHID connection. Only a device
  // newly remembered over Bluetooth restarts the flow (see onBluetoothDeviceRemembered).
  const knownDevices = useSelector(knownDevicesSelector);
  const [connectionKnownDevices, setConnectionKnownDevices] = useState(() =>
    // Without the Bluetooth transport a remembered Bluetooth device can never be reached.
    isBluetoothTransportEnabled()
      ? knownDevices
      : knownDevices.filter(device => !isBluetoothDevice(device)),
  );
  const { handleConnect, handleBuyDevice } = useLazyOnboardingActions();
  const { sourceFlow, analyticsProperties, reportFailure } = useDeviceIntentTracking();
  const [state, setState] = useState<ConnectDeviceUIState>({
    type: ConnectDeviceUIStateTypes.Loading,
  });
  const firedRef = useRef({
    prompted: false,
    connecting: false,
  });
  const acceptedLedgerDeviceModelIds = useMemo(
    () =>
      deviceConnectionParams.acceptedDeviceModelIds.map(
        deviceModelId => dmkToLedgerDeviceIdMap[deviceModelId],
      ),
    [deviceConnectionParams.acceptedDeviceModelIds],
  );

  const onBluetoothDeviceRemembered = useCallback((knownDevice: KnownDevice) => {
    const isSameDevice = (device: KnownDevice) =>
      device.transport === knownDevice.transport &&
      device.deviceModelId === knownDevice.deviceModelId;
    setConnectionKnownDevices(current =>
      current.find(isSameDevice)?.id === knownDevice.id
        ? current
        : [...current.filter(device => !isSameDevice(device)), knownDevice],
    );
  }, []);
  const { status: bluetoothStatus, connect: connectBluetooth } = useConnectBluetooth(
    onBluetoothDeviceRemembered,
  );

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
    const handleState = (nextState: ConnectDeviceUIState) => {
      setState(nextState);
      reportFailure(getConnectDeviceFailure(nextState, getTrackingTransport));
    };

    const subscription = connectDevice({
      knownDevices: connectionKnownDevices,
      acceptedDeviceModelIds: acceptedLedgerDeviceModelIds,
      dmk,
      onConnected: wrappedOnConnected,
      mockServerTransportEnabled: getEnv("MOCK_SERVER_TRANSPORT"),
    }).subscribe({ next: handleState });

    return () => {
      subscription.unsubscribe();
    };
  }, [
    acceptedLedgerDeviceModelIds,
    connectionKnownDevices,
    dmk,
    reportFailure,
    wrappedOnConnected,
  ]);

  return {
    state,
    onConnectLedgerDevice: handleConnect,
    onBuyLedgerDevice: handleBuyDevice,
    bluetooth: canConnectWithBluetooth(acceptedLedgerDeviceModelIds)
      ? { status: bluetoothStatus, onConnect: connectBluetooth }
      : null,
  };
}
