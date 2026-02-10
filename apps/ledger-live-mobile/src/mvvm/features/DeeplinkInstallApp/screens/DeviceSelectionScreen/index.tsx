import React, { useCallback, useState, useMemo, useEffect } from "react";
import { useIsFocused, useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Flex, Text } from "@ledgerhq/native-ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp } from "@react-navigation/native";
import { ScreenName } from "~/const";
import SelectDevice2, { SetHeaderOptionsRequest } from "~/components/SelectDevice2";
import { BaseNavigation } from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { openDeeplinkInstallAppDrawer, setSelectedDevice } from "~/reducers/deeplinkInstallApp";
import { getAppInstallConfig } from "../../constants/appInstallMap";

export function DeviceSelectionScreen() {
  const { t } = useTranslation();
  const isFocused = useIsFocused();
  const dispatch = useDispatch();
  const navigation = useNavigation<BaseNavigation>();
  const route =
    useRoute<RouteProp<BaseNavigatorStackParamList, ScreenName.DeeplinkInstallAppDeviceSelection>>();

  const appKey = route.params?.appKey;
  const appConfig = useMemo(() => (appKey ? getAppInstallConfig(appKey) : null), [appKey]);

  const [isHeaderOverridden, setIsHeaderOverridden] = useState(false);

  useEffect(() => {
    if (!appConfig) {
      navigation.goBack();
    }
  }, [appConfig, navigation]);

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

  if (!isFocused || !appConfig) return null;

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={{ flex: 1 }}>
      {!isHeaderOverridden && (
        <Flex px={16} pb={8}>
          <Text pt={3} fontWeight="semiBold" variant="h4">
            {t("deeplinkInstallApp.deviceSelection.title")}
          </Text>
        </Flex>
      )}

      <Flex flex={1}>
        <SelectDevice2
          onSelect={onSelectDevice}
          stopBleScanning={false}
          requestToSetHeaderOptions={requestToSetHeaderOptions}
          isChoiceDrawerDisplayedOnAddDevice={false}
        />
      </Flex>
    </SafeAreaView>
  );
}
