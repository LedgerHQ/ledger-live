import React, { useCallback, useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TFunction, useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { AppResult, createAction } from "@ledgerhq/live-common/hw/actions/app";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import { Flex } from "@ledgerhq/native-ui";
import { TrackScreen } from "../../analytics";
import SelectDevice2, {
  SetHeaderOptionsRequest,
} from "../../components/SelectDevice2";
import SelectDevice from "../../components/SelectDevice";
import RemoveDeviceMenu from "../../components/SelectDevice2/RemoveDeviceMenu";
import DeviceActionModal from "../../components/DeviceActionModal";
import NavigationScrollView from "../../components/NavigationScrollView";
import {
  ReactNavigationHeaderOptions,
  RootComposite,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "../../const";
import { NavigationHeaderBackButton } from "../../components/NavigationHeaderBackButton";

const action = createAction(connectApp);

type NavigationProps = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.DeviceConnect>
>;

export const deviceConnectHeaderOptions = (
  t: TFunction,
): ReactNavigationHeaderOptions => ({
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

  const [chosenDevice, setChosenDevice] = useState<Device | null>();
  const [showMenu, setShowMenu] = useState<boolean>(false);

  const newDeviceSelectionFeatureFlag = useFeature("llmNewDeviceSelection");

  const onShowMenu = useCallback((device: Device) => {
    setChosenDevice(device);
    setShowMenu(true);
  }, []);

  const onHideMenu = useCallback(() => setShowMenu(false), []);

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
      {newDeviceSelectionFeatureFlag?.enabled ? (
        <Flex px={16} py={5} flex={1}>
          <SelectDevice2
            onSelect={setDevice}
            stopBleScanning={!!device}
            requestToSetHeaderOptions={requestToSetHeaderOptions}
          />
        </Flex>
      ) : (
        <NavigationScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContainer}
        >
          <SelectDevice
            autoSelectOnAdd
            onSelect={setDevice}
            onBluetoothDeviceAction={onShowMenu}
          />
          {chosenDevice ? (
            <RemoveDeviceMenu
              open={showMenu}
              device={chosenDevice}
              onHideMenu={onHideMenu}
            />
          ) : null}
        </NavigationScrollView>
      )}
      <DeviceActionModal
        action={action}
        device={device}
        onResult={handleSuccess}
        onClose={resetDevice}
        request={{
          appName,
        }}
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
