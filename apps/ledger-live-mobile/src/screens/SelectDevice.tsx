import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import { useDispatch as useReduxDispatch } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useTheme } from "@react-navigation/native";
import { Flex } from "@ledgerhq/native-ui";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { TrackScreen } from "~/analytics";
import SelectDevice from "~/components/SelectDevice2";
import { setLastConnectedDevice, setReadOnlyMode } from "~/actions/settings";

// Called from a bunch of different navigators with different params…
export default function SelectDeviceScreen({
  navigation,
  route,
}: NativeStackScreenProps<{ [key: string]: object }>) {
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

  /** Parameter used to prevent auto selection and force the user to manually select a device */
  const forceSelectDevice = "forceSelectDevice" in route.params && route.params.forceSelectDevice;

  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen category={route.name.replace("SelectDevice", "")} name="SelectDevice" />
      <Flex px={16} pb={8} flex={1}>
        <SelectDevice
          onSelect={onSelect}
          requestToSetHeaderOptions={requestToSetHeaderOptions}
          autoSelectLastConnectedDevice={!forceSelectDevice}
        />
      </Flex>
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
