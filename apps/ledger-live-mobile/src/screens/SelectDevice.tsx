import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import { useDispatch as useReduxDispatch } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { useTheme } from "@react-navigation/native";
import { Flex } from "@ledgerhq/native-ui";
import { StackScreenProps } from "@react-navigation/stack";

import { TrackScreen } from "~/analytics";
import SelectDeviceComp from "~/components/SelectDevice";
import SelectDeviceComp2 from "~/components/SelectDevice2";
import NavigationScrollView from "~/components/NavigationScrollView";
import { setLastConnectedDevice, setReadOnlyMode } from "~/actions/settings";
import SkipSelectDevice from "./SkipSelectDevice";
import { AddAccountsNavigatorParamList } from "~/components/RootNavigator/types/AddAccountsNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ReceiveFundsStackParamList } from "~/components/RootNavigator/types/ReceiveFundsNavigator";
import { ScreenName } from "~/const";

// TODO: FIX THE StackScreenProps<{ [key: string]: object }>
type SelectDeviceNav =
  | StackNavigatorProps<AddAccountsNavigatorParamList, ScreenName.AddAccountsSelectDevice>
  | StackNavigatorProps<ReceiveFundsStackParamList, ScreenName.ReceiveAddAccountSelectDevice>
  | StackNavigatorProps<ReceiveFundsStackParamList, ScreenName.ReceiveConnectDevice>;

// Called from a bunch of different navigators with different params…
export default function SelectDevice({
  navigation,
  route,
}: StackScreenProps<{ [key: string]: object }>) {
  const { colors } = useTheme();
  const dispatchRedux = useReduxDispatch();
  const onNavigate = useCallback(
    (device: Device) => {
      // Assumes that it will always navigate to a "ConnectDevice"
      // type of component accepting mostly the same params as this one.
      navigation.navigate(route.name.replace("SelectDevice", "ConnectDevice"), {
        ...route.params,
        device,
      });
    },
    [navigation, route.name, route.params],
  );

  const newDeviceSelectionFeatureFlag = useFeature("llmNewDeviceSelection");

  const onSelect = useCallback(
    (device: Device) => {
      dispatchRedux(setLastConnectedDevice(device));
      dispatchRedux(setReadOnlyMode(false));
      onNavigate(device);
    },
    [dispatchRedux, onNavigate],
  );

  // Does not react to an header update request: too many flows use this screen.
  // Keeping the header from the original flow.
  const requestToSetHeaderOptions = useCallback(() => undefined, []);

  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <SkipSelectDevice route={route as SelectDeviceNav["route"]} onResult={onNavigate} />
      <TrackScreen category={route.name.replace("SelectDevice", "")} name="SelectDevice" />
      {newDeviceSelectionFeatureFlag?.enabled ? (
        <Flex px={16} pb={8} flex={1}>
          <SelectDeviceComp2
            onSelect={onSelect}
            requestToSetHeaderOptions={requestToSetHeaderOptions}
          />
        </Flex>
      ) : (
        <NavigationScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <SelectDeviceComp onSelect={onSelect} />
        </NavigationScrollView>
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
});
