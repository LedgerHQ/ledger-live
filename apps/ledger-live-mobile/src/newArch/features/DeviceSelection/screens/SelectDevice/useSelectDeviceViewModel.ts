import { RouteProp, useNavigation } from "@react-navigation/core";
import { useCallback, useEffect, useState } from "react";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useIsFocused } from "@react-navigation/native";
import { prepareCurrency } from "~/bridge/cache";
import { NavigatorName, ScreenName } from "~/const";
import { useAppDeviceAction } from "~/hooks/deviceActions";
import { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import { DeviceSelectionNavigationProps, DeviceSelectionNavigatorParamsList } from "../../types";
import { NetworkBasedAddAccountNavigator } from "~/newArch/features/Accounts/screens/AddAccount/types";

export default function useSelectDeviceViewModel(
  route: RouteProp<
    DeviceSelectionNavigatorParamsList & Partial<NetworkBasedAddAccountNavigator>,
    ScreenName.SelectDevice
  >,
) {
  const { context, currency } = route.params;
  const navigation = useNavigation<DeviceSelectionNavigationProps["navigation"]>();
  const [device, setDevice] = useState<Device | null>(null);
  const action = useAppDeviceAction();
  const isFocused = useIsFocused();

  const onClose = useCallback(() => {
    setDevice(null);
  }, []);

  const onResult = useCallback(
    (meta: AppResult) => {
      setDevice(null);
      const arg = { ...route.params, ...meta, context };
      navigation.navigate(NavigatorName.AddAccounts, {
        screen: ScreenName.ScanDeviceAccounts,
        params: {
          ...arg,
        },
      });
    },
    [navigation, route, context],
  );

  useEffect(() => {
    // load ahead of time
    prepareCurrency(currency);
  }, [currency]);

  return {
    onResult,
    device,
    action,
    isFocused,
    onClose,
    setDevice,
  };
}
