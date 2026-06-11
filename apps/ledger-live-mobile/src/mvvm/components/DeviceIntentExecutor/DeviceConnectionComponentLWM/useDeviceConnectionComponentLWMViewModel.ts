import { useCallback, useEffect, useRef, useState } from "react";
import { Linking, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { DeviceConnectionResult } from "@ledgerhq/device-intent";
import { log } from "@ledgerhq/logs";
import { useFeature, useWalletFeaturesConfig } from "@features/platform-feature-flags";
import {
  connectDeviceUseCase,
  type ConnectDeviceUIState,
  ConnectDeviceUIStateTypes,
  useDeviceManagementKit,
} from "@ledgerhq/live-dmk-mobile";
import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
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
import {
  trackDeviceConnected,
  trackDeviceConnecting,
  trackDevicePrompted,
} from "../utils/trackDeviceIntent";
import { useSourceFlow } from "../utils/SourceFlowContext";

const LOG_TYPE = "DeviceConnectionComponentLWM";

type UseDeviceConnectionComponentLWMViewModelParams = {
  onConnected: (connectionResult: DeviceConnectionResult) => void;
};

export type DeviceConnectionComponentLWMViewModel = {
  state: ConnectDeviceUIState;
  platform: Exclude<AppPlatform, "desktop">;
  onConnectLedgerDevice: () => void;
  onBuyLedgerDevice: () => void;
};

export function useDeviceConnectionComponentLWMViewModel({
  onConnected,
}: UseDeviceConnectionComponentLWMViewModelParams): DeviceConnectionComponentLWMViewModel {
  const platform = Platform.OS === "ios" ? "ios" : "android";
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const dispatch = useDispatch();
  const dmk = useDeviceManagementKit();
  const buyDeviceFromLive = useFeature("buyDeviceFromLive");
  const { shouldDisplayMyWallet } = useWalletFeaturesConfig("mobile");
  const knownDevices = useSelector(knownDevicesSelector);
  const sourceFlow = useSourceFlow();
  const [state, setState] = useState<ConnectDeviceUIState>({
    type: ConnectDeviceUIStateTypes.Loading,
  });
  // DMK unavailability is a misconfiguration (LWM provider missing) rather than a
  // runtime connection failure: throw synchronously so the nearest React
  // ErrorBoundary catches it. Runtime errors that escape the inner state machine
  // are funnelled by `connectDeviceUseCase` into a terminal `UnknownError` UI state
  // and reach this hook via `next`, never via the observable's error channel.
  if (!dmk) {
    log(LOG_TYPE, "DMK unavailable");
    throw new Error("Device Management Kit is not available");
  }

  // Funnel-firing guards: each event fires at most once per ViewModel lifetime.
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
        trackDevicePrompted({ sourceFlow });
        return;
      case ConnectDeviceUIStateTypes.Connecting: {
        if (firedRef.current.connecting) return;
        firedRef.current.connecting = true;
        trackDeviceConnecting({
          sourceFlow,
          modelId: state.device.deviceModelId,
          transport: state.device.transport === rnHidTransportIdentifier ? "usb" : "ble",
        });
        return;
      }
    }
  }, [state, sourceFlow]);

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
      const modelId = dmkToLedgerDeviceIdMap[result.connectedDevice.modelId];
      const transport: "ble" | "usb" = result.connectedDevice.type === "USB" ? "usb" : "ble";

      trackDeviceConnected({ sourceFlow, modelId, transport });

      dispatch(
        setLastConnectedDevice({
          deviceId: result.connectedDevice.id,
          deviceName: result.connectedDevice.name,
          modelId,
          wired: result.connectedDevice.type === "USB",
        }),
      );

      dispatch(setHasConnectedDevice(true));

      dispatch(
        updateKnownDevice({
          id: result.connectedDevice.id,
          name: result.connectedDevice.name,
          deviceModelId: modelId,
          transport: result.connectedDevice.transport,
        }),
      );

      if (result.connectedDevice.type !== "USB") {
        dispatch(
          updateKnownBleDevice({
            id: result.connectedDevice.id,
            name: result.connectedDevice.name,
            modelId,
          }),
        );
      }

      onConnected(result);
    },
    [dispatch, onConnected, sourceFlow],
  );

  useEffect(() => {
    const subscription = connectDeviceUseCase({
      knownDevices,
      dmk,
      onConnected: wrappedOnConnected,
    }).subscribe({ next: setState });

    return () => subscription.unsubscribe();
  }, [dmk, knownDevices, wrappedOnConnected]);

  return {
    state,
    platform,
    onConnectLedgerDevice,
    onBuyLedgerDevice,
  };
}
