import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { useSelector } from "~/context/hooks";
import { setOriginFlow } from "~/analytics/originFlow";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import { useRebornBuyDeviceDrawerController } from "LLM/features/Reborn/hooks/useRebornBuyDeviceDrawerController";
import type { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { SelectDeviceRouteParams } from "../types";

/** Opens the add account device list. */
export function useNavigateToSelectDevice() {
  const navigation = useNavigation<StackNavigatorNavigation<BaseNavigatorStackParamList>>();
  return useCallback(
    (params: SelectDeviceRouteParams) =>
      navigation.navigate(NavigatorName.DeviceSelection, {
        screen: ScreenName.SelectDevice,
        params,
      }),
    [navigation],
  );
}

/** Opens the add account device list. In read-only mode, asks for a device first. */
export function useOpenSelectDevice() {
  const navigateToSelectDevice = useNavigateToSelectDevice();
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const { openDrawer } = useRebornBuyDeviceDrawerController();

  return useCallback(
    (params: SelectDeviceRouteParams) => {
      if (!readOnlyModeEnabled) {
        navigateToSelectDevice(params);
        return;
      }
      setOriginFlow(params.sourceScreenName ?? "Device Selection");
      openDrawer({
        // Under onboarding: the device list shows when onboarding closes.
        onConnect: () => navigateToSelectDevice(params),
        onDismiss: params.onCloseNavigation,
      });
    },
    [readOnlyModeEnabled, navigateToSelectDevice, openDrawer],
  );
}
