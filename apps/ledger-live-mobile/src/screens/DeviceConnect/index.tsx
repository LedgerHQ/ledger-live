import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TFunction, useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import { Flex } from "@ledgerhq/native-ui";
import { TrackScreen } from "~/analytics";
import SelectDevice2, { SetHeaderOptionsRequest } from "~/components/SelectDevice2";
import DeviceActionModal from "~/components/DeviceActionModal";
import {
  ReactNavigationHeaderOptions,
  RootComposite,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import { NavigationHeaderBackButton } from "~/components/NavigationHeaderBackButton";
import { useAppDeviceAction } from "~/hooks/deviceActions";

type NavigationProps = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.DeviceConnect>
>;

export const deviceConnectHeaderOptions = (t: TFunction): ReactNavigationHeaderOptions => ({
  headerShown: true,
  title: t("deviceConnect.title"),
  headerRight: () => null,
  headerLeft: () => <NavigationHeaderBackButton />,
});

export default function DeviceConnect({ navigation, route }: NavigationProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [device, setDevice] = useState<Device | null | undefined>();
  const { appName = "BOLOS", onSuccess } = route.params;
  const request = useMemo(
    () => ({
      appName,
    }),
    [appName],
  );
  const action = useAppDeviceAction();

  const onDone = useCallback(() => {
    navigation.pop();
  }, [navigation]);

  const handleSuccess = useCallback(
    (result: AppResult) => {
      onSuccess(result);
      onDone();
    },
    [onDone, onSuccess],
  );

  const resetDevice = useCallback(() => {
    setDevice(undefined);
  }, []);

  const requestToSetHeaderOptions = useCallback(
    (request: SetHeaderOptionsRequest) => {
      if (request.type === "set") {
        navigation.setOptions({
          headerShown: true,
          headerLeft: request.options.headerLeft,
          headerRight: request.options.headerRight,
        });
      } else {
        // Sets back the header to its initial values set for this screen
        navigation.setOptions({
          headerLeft: () => null,
          headerRight: () => null,
          ...deviceConnectHeaderOptions(t),
        });
      }
    },
    [navigation, t],
  );

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen category="DeviceConnect" name="ConnectDevice" />
      <Flex px={16} py={5} flex={1}>
        <SelectDevice2
          onSelect={setDevice}
          stopBleScanning={!!device}
          requestToSetHeaderOptions={requestToSetHeaderOptions}
        />
      </Flex>
      <DeviceActionModal
        action={action}
        device={device}
        onResult={handleSuccess}
        onClose={resetDevice}
        request={request}
        analyticsPropertyFlow={"device connect"}
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollContainer: {
    padding: 16,
  },
});
