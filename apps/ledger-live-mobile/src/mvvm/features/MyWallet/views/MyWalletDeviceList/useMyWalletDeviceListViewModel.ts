import { useCallback, useLayoutEffect, useState } from "react";
import { useIsFocused, useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { track } from "@shared/analytics";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Result } from "@ledgerhq/live-common/hw/actions/manager";
import { type DeviceConnectionResult, dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch } from "~/context/hooks";
import { updateMainNavigatorVisibility } from "~/actions/appstate";
import { NavigatorName, ScreenName } from "~/const";
import { useManagerDeviceAction } from "~/hooks/deviceActions";
import { useAutoRedirectToPostOnboarding } from "~/hooks/useAutoRedirectToPostOnboarding";
import { useUnifiedAddDevice } from "LLM/features/DeviceOnboarding/hooks/useUnifiedAddDevice";
import type { MyWalletNavigatorStackParamList } from "../../types";
import type { MyWalletDeviceListProps, MyWalletDeviceListViewProps } from "./types";

function toLegacyDevice(result: DeviceConnectionResult): Device {
  return {
    deviceId: result.compatDeviceId,
    deviceName: result.compatDeviceName,
    modelId: dmkToLedgerDeviceIdMap[result.connectedDevice.modelId],
    wired: result.compatDeviceWired,
  };
}

/**
 * Bridges the device list to the legacy My Ledger device action until the "open My Ledger"
 * device intent replaces it: the lock check, then the device action modal.
 */
export function useMyWalletDeviceListViewModel({
  onAddModeChange,
}: MyWalletDeviceListProps): MyWalletDeviceListViewProps {
  const navigation =
    useNavigation<NativeStackNavigationProp<{ [key: string]: object | undefined }>>();
  const { params } =
    useRoute<RouteProp<MyWalletNavigatorStackParamList, typeof ScreenName.MyWallet>>();
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const { top: topInset } = useSafeAreaInsets();
  const action = useManagerDeviceAction({ resolveOsUpdates: true });
  const onAddDevice = useUnifiedAddDevice();

  // A redirect, for example from the "not enough space" error of a flow, opens My Ledger at once.
  const redirectedDevice = params?.device;
  const [lastRedirectedDevice, setLastRedirectedDevice] = useState(redirectedDevice);
  const [device, setDevice] = useState<Device | undefined>(redirectedDevice);
  if (redirectedDevice !== lastRedirectedDevice) {
    setLastRedirectedDevice(redirectedDevice);
    setDevice(redirectedDevice);
  }

  const [isAdding, setIsAdding] = useState(false);
  const [deviceToCheck, setDeviceToCheck] = useState<Device | null>(null);

  useAutoRedirectToPostOnboarding();

  // Before paint, so that the header and the tab bar go in the same frame as the other sections.
  useLayoutEffect(() => {
    if (!isAdding || !isFocused) return;
    navigation.setOptions({ headerShown: false });
    dispatch(updateMainNavigatorVisibility(false));
    return () => {
      navigation.setOptions({ headerShown: true });
      dispatch(updateMainNavigatorVisibility(true));
    };
  }, [dispatch, isAdding, isFocused, navigation]);

  const handleAddModeChange = useCallback(
    (adding: boolean) => {
      setIsAdding(adding);
      onAddModeChange?.(adding);
    },
    [onAddModeChange],
  );

  const onConnected = useCallback((result: DeviceConnectionResult) => {
    const connectedDevice = toLegacyDevice(result);
    track("ManagerDeviceEntered", { modelId: connectedDevice.modelId });
    setDeviceToCheck(connectedDevice);
  }, []);

  const onDeviceUnlocked = useCallback(() => {
    if (deviceToCheck) setDevice(deviceToCheck);
    setDeviceToCheck(null);
  }, [deviceToCheck]);

  const onCloseLockedCheck = useCallback(() => setDeviceToCheck(null), []);

  const onDeviceNotFound = useCallback(() => {
    navigation.navigate(NavigatorName.BaseOnboarding, {
      screen: NavigatorName.Onboarding,
      params: { screen: ScreenName.OnboardingDeviceSelection, params: { missingDevice: true } },
    });
  }, [navigation]);

  const resetDevice = useCallback(() => setDevice(undefined), []);

  const onResult = useCallback(
    (result: Result) => {
      setDevice(undefined);
      if (result && "result" in result) {
        navigation.navigate(NavigatorName.MyLedger, {
          screen: ScreenName.MyLedgerDevice,
          params: {
            ...result,
            firmwareUpdate: params?.firmwareUpdate,
            searchQuery: params?.searchQuery || params?.installApp,
          },
        });
      }
    },
    [navigation, params?.firmwareUpdate, params?.installApp, params?.searchQuery],
  );

  const onError = useCallback((error: Error) => {
    if (error?.name === "BluetoothRequired") {
      setDevice(undefined);
    }
  }, []);

  return {
    isAdding,
    topInset,
    isPaused: deviceToCheck !== null || device !== undefined,
    onConnected,
    onAddModeChange: handleAddModeChange,
    onDeviceNotFound,
    onAddDevice,
    deviceToCheck,
    onDeviceUnlocked,
    onCloseLockedCheck,
    device,
    action,
    onResult,
    onCloseModal: resetDevice,
    onModalHide: resetDevice,
    onError,
  };
}
