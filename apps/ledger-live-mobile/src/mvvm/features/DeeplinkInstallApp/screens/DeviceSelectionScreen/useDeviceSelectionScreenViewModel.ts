import { useCallback, useState, useMemo, useEffect } from "react";
import { useIsFocused, useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useDispatch } from "~/context/hooks";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ScreenName } from "~/const";
import { SetHeaderOptionsRequest } from "~/components/SelectDevice2";
import { BaseNavigation } from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { openDeeplinkInstallAppDrawer, setSelectedDevice } from "~/reducers/deeplinkInstallApp";
import { getAppInstallConfig } from "../../constants/appInstallMap";

export function useDeviceSelectionScreenViewModel() {
  const isFocused = useIsFocused();
  const dispatch = useDispatch();
  const navigation = useNavigation<BaseNavigation>();
  const route =
    useRoute<
      RouteProp<BaseNavigatorStackParamList, ScreenName.DeeplinkInstallAppDeviceSelection>
    >();

  const appKey = route.params?.appKey;
  const appConfig = useMemo(() => (appKey ? getAppInstallConfig(appKey) : null), [appKey]);

  const [isHeaderOverridden, setIsHeaderOverridden] = useState(false);

  useEffect(() => {
    if (!appConfig) {
      navigation.goBack();
    }
  }, [appConfig, navigation]);

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const onSelectDevice = useCallback(
    (selectedDevice?: Device) => {
      if (selectedDevice && appKey) {
        dispatch(setSelectedDevice(selectedDevice));
        navigation.goBack();
        dispatch(openDeeplinkInstallAppDrawer({ appToInstall: appKey }));
      }
    },
    [appKey, dispatch, navigation],
  );

  const requestToSetHeaderOptions = useCallback(
    (requestObj: SetHeaderOptionsRequest) => {
      if (requestObj.type === "set") {
        navigation.setOptions({
          headerShown: true,
          headerLeft: requestObj.options.headerLeft,
          headerRight: requestObj.options.headerRight,
          title: "",
        });
        setIsHeaderOverridden(true);
      } else {
        navigation.setOptions({
          headerShown: false,
          headerLeft: () => null,
          headerRight: () => null,
        });
        setIsHeaderOverridden(false);
      }
    },
    [navigation],
  );

  return {
    isFocused,
    appConfig,
    isHeaderOverridden,
    handleClose,
    onSelectDevice,
    requestToSetHeaderOptions,
  };
}

export type DeviceSelectionScreenViewProps = ReturnType<typeof useDeviceSelectionScreenViewModel>;
