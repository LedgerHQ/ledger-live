import { RouteProp, useNavigation } from "@react-navigation/core";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { prepareCurrency } from "~/bridge/cache";
import { NavigatorName, ScreenName } from "~/const";
import { useAppDeviceAction } from "~/hooks/deviceActions";
import { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import { DeviceSelectionNavigationProps, DeviceSelectionNavigatorParamsList } from "../../types";
import { getCustomAddAccountFlow } from "LLM/features/Accounts/utils/customAddAccountFlow";
import { NetworkBasedAddAccountNavigator } from "LLM/features/Accounts/screens/AddAccount/types";
import { useSelector } from "~/context/hooks";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";

export default function useSelectDeviceViewModel(
  route: RouteProp<
    DeviceSelectionNavigatorParamsList & Partial<NetworkBasedAddAccountNavigator>,
    ScreenName.SelectDevice
  >,
) {
  const params = route.params ?? {};
  const { context, currency, onCloseNavigation } = params;
  const navigation = useNavigation<DeviceSelectionNavigationProps["navigation"]>();
  const [device, setDevice] = useState<Device | null>(null);
  const action = useAppDeviceAction();
  const isFocused = useIsFocused();
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);

  const onDeviceUpdated = useRef<(() => void) | undefined>(undefined);

  const registerDeviceSelection = useCallback((handler: () => void) => {
    onDeviceUpdated.current = handler;
  }, []);

  const selectDevice = useCallback((device: Device | null) => {
    setDevice(device);
    onDeviceUpdated.current?.();
  }, []);

  const onClose = useCallback(() => {
    setDevice(null);
  }, []);

  const onResult = useCallback(
    (meta: AppResult) => {
      setDevice(null);

      const navigationParams = {
        ...route.params,
        ...meta,
        context,
        sourceScreenName: ScreenName.SelectDevice,
      };

      const customFlow = currency ? getCustomAddAccountFlow(currency) : null;
      if (customFlow?.onDeviceConnected) {
        customFlow.onDeviceConnected({ navigation, routeParams: navigationParams });
        return;
      }

      // Always use navigate instead of replace to keep SelectDevice in the stack.
      // This allows retry navigation when device errors occur (e.g., device locked).
      // Previously, inline flows used replace which prevented retry navigation.
      navigation.navigate(NavigatorName.AddAccounts, {
        screen: ScreenName.ScanDeviceAccounts,
        params: navigationParams,
      });
    },
    [navigation, route, context, currency],
  );

  useEffect(() => {
    // load ahead of time
    prepareCurrency(currency);
  }, [currency]);

  // Opened under device onboarding: back here without a device means the user gave up.
  useFocusEffect(
    useCallback(() => {
      if (!readOnlyModeEnabled) return;
      onCloseNavigation?.();
      navigation.getParent()?.goBack();
    }, [readOnlyModeEnabled, onCloseNavigation, navigation]),
  );

  return {
    onResult,
    device,
    action,
    isFocused,
    onClose,
    selectDevice,
    registerDeviceSelection,
    readOnlyModeEnabled,
    currency,
  };
}
