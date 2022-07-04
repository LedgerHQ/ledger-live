// @flow
import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import { useDispatch as useReduxDispatch } from "react-redux";
import SafeAreaView from "react-native-safe-area-view";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import type {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/lib/types";
import { useTheme } from "@react-navigation/native";
import { TrackScreen } from "../analytics";
import SelectDeviceComp from "../components/SelectDevice";
import NavigationScrollView from "../components/NavigationScrollView";
import { setLastConnectedDevice, setReadOnlyMode } from "../actions/settings";
import SkipSelectDevice from "./SkipSelectDevice";

const forceInset = { bottom: "always" };

type Props = {
  navigation: any,
  route: { params: RouteParams, name: string },
};

type RouteParams = {
  accountId: string,
  transaction: Transaction,
  status: TransactionStatus,
  appName?: string,
};

export default function SelectDevice({ navigation, route }: Props) {
  const { colors } = useTheme();
  const dispatchRedux = useReduxDispatch();
  const onNavigate = useCallback(
    device => {
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

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      forceInset={forceInset}
    >
      <NavigationScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <SkipSelectDevice route={route} onResult={onNavigate} />
        <TrackScreen
          category={route.name.replace("SelectDevice", "")}
          name="SelectDevice"
        />
        <SelectDeviceComp onSelect={onSelect} />
      </NavigationScrollView>
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
