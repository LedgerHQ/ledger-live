import { useCallback, useEffect, useState } from "react";
import { Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { DeviceConnectionResult } from "@ledgerhq/device-intent";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import {
  connectDeviceUseCase,
  type ConnectDeviceUIState,
  ConnectDeviceUIStateTypes,
  useDeviceManagementKit,
} from "@ledgerhq/live-dmk-mobile";
import { setHasConnectedDevice } from "~/actions/appstate";
import { setLastConnectedDevice } from "~/actions/settings";
import { useDispatch, useSelector } from "~/context/hooks";
import { knownDevicesSelector, updateKnownDevice } from "~/reducers/knownDevices";
import { updateKnownBleDevice } from "~/actions/ble";
import { NavigatorName, ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { urls } from "~/utils/urls";

type UseDeviceConnectionComponentLWMViewModelParams = {
  onConnected: (connectionResult: DeviceConnectionResult) => void;
  onError: (error: unknown) => void;
};

export type DeviceConnectionComponentLWMViewModel = {
  state: ConnectDeviceUIState;
  onConnectLedgerDevice: () => void;
  onBuyLedgerDevice: () => void;
};

export function useDeviceConnectionComponentLWMViewModel({
  onConnected,
  onError,
}: UseDeviceConnectionComponentLWMViewModelParams): DeviceConnectionComponentLWMViewModel {
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const dispatch = useDispatch();
  const dmk = useDeviceManagementKit();
  const buyDeviceFromLive = useFeature("buyDeviceFromLive");
  const knownDevices = useSelector(knownDevicesSelector);
  const [state, setState] = useState<ConnectDeviceUIState>({
    type: ConnectDeviceUIStateTypes.Loading,
  });

  const onConnectLedgerDevice = useCallback(() => {
    navigation.navigate(ScreenName.BleDevicePairingFlow);
  }, [navigation]);

  const onBuyLedgerDevice = useCallback(() => {
    if (buyDeviceFromLive?.enabled) {
      navigation.navigate(NavigatorName.BuyDevice, {
        screen: ScreenName.PurchaseDevice,
      });
    } else {
      Linking.openURL(urls.buyNanoX);
    }
  }, [buyDeviceFromLive?.enabled, navigation]);

  const wrappedOnConnected = useCallback(
    (result: DeviceConnectionResult) => {
      dispatch(
        setLastConnectedDevice({
          deviceId: result.compatDeviceId,
          deviceName: result.compatDeviceName,
          modelId: result.compatDeviceModelId,
          wired: result.compatDeviceWired,
        }),
      );

      dispatch(setHasConnectedDevice(true));

      dispatch(
        updateKnownDevice({
          id: result.compatDeviceId,
          name: result.compatDeviceName,
          deviceModelId: result.compatDeviceModelId,
          transport: result.connectedDevice.transport,
        }),
      );

      if (!result.compatDeviceWired) {
        dispatch(
          updateKnownBleDevice({
            id: result.compatDeviceId,
            name: result.compatDeviceName,
            modelId: result.compatDeviceModelId,
          }),
        );
      }

      onConnected(result);
    },
    [dispatch, onConnected],
  );

  useEffect(() => {
    if (!dmk) {
      onError(new Error("Device Management Kit is not available"));
      return;
    }

    const subscription = connectDeviceUseCase({
      knownDevices,
      dmk,
      onConnected: wrappedOnConnected,
    }).subscribe({
      next: setState,
      error: onError,
    });

    return () => subscription.unsubscribe();
  }, [dmk, knownDevices, onError, wrappedOnConnected]);

  return {
    state,
    onConnectLedgerDevice,
    onBuyLedgerDevice,
  };
}
