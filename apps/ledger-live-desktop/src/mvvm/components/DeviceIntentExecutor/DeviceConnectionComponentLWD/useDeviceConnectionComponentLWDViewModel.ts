import { useCallback, useEffect, useState } from "react";
import type { DeviceConnectionParams, DeviceConnectionResult } from "@ledgerhq/device-intent";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import {
  connectDevice,
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
  useDeviceManagementKit,
} from "@ledgerhq/live-dmk-desktop";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useLazyOnboardingActions } from "LLD/hooks/useLazyOnboardingActions";
import { addNewDeviceModel } from "~/renderer/actions/settings";
import { knownDevicesSelector } from "~/renderer/reducers/knownDevices";

const missingDeviceManagementKitError = new Error("Device Management Kit is not available");

type UseDeviceConnectionComponentLWDViewModelParams = {
  deviceConnectionParams: DeviceConnectionParams;
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
  const { handleConnect, handleBuyDevice } = useLazyOnboardingActions();
  const [state, setState] = useState<ConnectDeviceUIState>({
    type: ConnectDeviceUIStateTypes.Loading,
  });

  const wrappedOnConnected = useCallback(
    (result: DeviceConnectionResult) => {
      const modelId = dmkToLedgerDeviceIdMap[result.connectedDevice.modelId];
      dispatch(addNewDeviceModel({ deviceModelId: modelId }));

      onConnected(result);
    },
    [dispatch, onConnected],
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
      knownDevices,
      acceptedDeviceModelIds: deviceConnectionParams.acceptedDeviceModelIds,
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
  }, [deviceConnectionParams.acceptedDeviceModelIds, dmk, knownDevices, wrappedOnConnected]);

  return {
    state,
    onConnectLedgerDevice: handleConnect,
    onBuyLedgerDevice: handleBuyDevice,
  };
}
