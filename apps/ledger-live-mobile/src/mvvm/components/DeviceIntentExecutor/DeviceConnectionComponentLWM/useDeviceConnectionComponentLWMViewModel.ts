import { useCallback, useEffect, useState } from "react";
import { Linking, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { DeviceConnectionResult } from "@ledgerhq/device-intent";
import { useFeature, useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
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
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import type { AppPlatform } from "@ledgerhq/live-common/platform/types";

type UseDeviceConnectionComponentLWMViewModelParams = {
  onConnected: (connectionResult: DeviceConnectionResult) => void;
  onError: (error: unknown) => void;
};

export type DeviceConnectionComponentLWMViewModel = {
  state: ConnectDeviceUIState;
  platform: Exclude<AppPlatform, "desktop">;
  onConnectLedgerDevice: () => void;
  onBuyLedgerDevice: () => void;
};

export function useDeviceConnectionComponentLWMViewModel({
  onConnected,
  onError,
}: UseDeviceConnectionComponentLWMViewModelParams): DeviceConnectionComponentLWMViewModel {
  const platform = Platform.OS === "ios" ? "ios" : "android";
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const dispatch = useDispatch();
  const dmk = useDeviceManagementKit();
  const buyDeviceFromLive = useFeature("buyDeviceFromLive");
  const { shouldDisplayMyWallet } = useWalletFeaturesConfig("mobile");
  const knownDevices = useSelector(knownDevicesSelector);
  const [state, setState] = useState<ConnectDeviceUIState>({
    type: ConnectDeviceUIStateTypes.Loading,
  });

  const onConnectLedgerDevice = useCallback(() => {
    const params = undefined;

    if (shouldDisplayMyWallet) {
      navigation.navigate(NavigatorName.MyWallet, {
        state: {
          routes: [{ name: ScreenName.MyWallet, params }],
        },
      });
      return;
    }

    navigation.navigate(NavigatorName.MyLedger, {
      state: {
        routes: [{ name: ScreenName.MyLedgerChooseDevice, params }],
      },
    });
  }, [navigation, shouldDisplayMyWallet]);

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
          deviceId: result.connectedDevice.id,
          deviceName: result.connectedDevice.name,
          modelId: dmkToLedgerDeviceIdMap[result.connectedDevice.modelId],
          wired: result.connectedDevice.type === "USB",
        }),
      );

      dispatch(setHasConnectedDevice(true));

      dispatch(
        updateKnownDevice({
          id: result.connectedDevice.id,
          name: result.connectedDevice.name,
          deviceModelId: dmkToLedgerDeviceIdMap[result.connectedDevice.modelId],
          transport: result.connectedDevice.transport,
        }),
      );

      if (result.connectedDevice.type !== "USB") {
        dispatch(
          updateKnownBleDevice({
            id: result.connectedDevice.id,
            name: result.connectedDevice.name,
            modelId: dmkToLedgerDeviceIdMap[result.connectedDevice.modelId],
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
    platform,
    onConnectLedgerDevice,
    onBuyLedgerDevice,
  };
}
