import { RouteProp, useNavigation } from "@react-navigation/core";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useIsFocused } from "@react-navigation/native";
import { prepareCurrency } from "~/bridge/cache";
import { NavigatorName, ScreenName } from "~/const";
import { useAppDeviceAction } from "~/hooks/deviceActions";
import { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import { DeviceSelectionNavigationProps, DeviceSelectionNavigatorParamsList } from "../../types";
import { NetworkBasedAddAccountNavigator } from "LLM/features/Accounts/screens/AddAccount/types";
import { useDispatch, useSelector } from "~/context/hooks";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import { openRebornBuyDeviceDrawer } from "~/reducers/rebornBuyDeviceDrawer";
import { setOriginFlow } from "~/analytics/originFlow";

export default function useSelectDeviceViewModel(
  route: RouteProp<
    DeviceSelectionNavigatorParamsList & Partial<NetworkBasedAddAccountNavigator>,
    ScreenName.SelectDevice
  >,
) {
  const params = route.params ?? {};
  const { context, currency, onCloseNavigation, sourceScreenName } = params;
  const navigation = useNavigation<DeviceSelectionNavigationProps["navigation"]>();
  const dispatch = useDispatch();
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const [device, setDevice] = useState<Device | null>(null);
  const action = useAppDeviceAction();
  const isFocused = useIsFocused();
  const hasRedirectedRef = useRef(false);

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

      const params = {
        ...route.params,
        ...meta,
        context,
        sourceScreenName: ScreenName.SelectDevice,
      };

      // Always use navigate instead of replace to keep SelectDevice in the stack.
      // This allows retry navigation when device errors occur (e.g., device locked).
      // Previously, inline flows used replace which prevented retry navigation.
      navigation.navigate(NavigatorName.AddAccounts, {
        screen: ScreenName.ScanDeviceAccounts,
        params,
      });
    },
    [navigation, route, context],
  );

  useEffect(() => {
    // load ahead of time
    prepareCurrency(currency);
  }, [currency]);

  useEffect(() => {
    if (!readOnlyModeEnabled || hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;
    onCloseNavigation?.();
    navigation.getParent()?.goBack();
    const source = sourceScreenName ?? "Device Selection";
    setOriginFlow(source);
    dispatch(openRebornBuyDeviceDrawer());
  }, [readOnlyModeEnabled, onCloseNavigation, sourceScreenName, navigation, dispatch]);

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
