import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, SafeAreaView } from "react-native";
import { useDispatch } from "react-redux";
import { Flex } from "@ledgerhq/native-ui";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { createAction } from "@ledgerhq/live-common/hw/actions/app";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import { useIsFocused, useTheme } from "@react-navigation/native";
import { prepareCurrency } from "../../bridge/cache";
import { ScreenName } from "../../const";
import { TrackScreen } from "../../analytics";
import SelectDevice from "../../components/SelectDevice";
import SelectDevice2 from "../../components/SelectDevice2";
import NavigationScrollView from "../../components/NavigationScrollView";
import DeviceActionModal from "../../components/DeviceActionModal";
import SkipSelectDevice from "../SkipSelectDevice";
import { setLastConnectedDevice } from "../../actions/settings";
import { ReceiveFundsStackParamList } from "../../components/RootNavigator/types/ReceiveFundsNavigator";
import { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";

const action = createAction(connectApp);

export default function AddAccountsSelectDevice({
  navigation,
  route,
}: StackNavigatorProps<
  ReceiveFundsStackParamList,
  ScreenName.ReceiveAddAccountSelectDevice
>) {
  const { currency } = route.params;
  const { colors } = useTheme();
  const [device, setDevice] = useState<Device | null>(null);
  const dispatch = useDispatch();

  const isFocused = useIsFocused();
  const newDeviceSelectionFeatureFlag = useFeature("llmNewDeviceSelection");

  const onSetDevice = useCallback(
    device => {
      dispatch(setLastConnectedDevice(device));
      setDevice(device);
    },
    [dispatch],
  );

  const onClose = useCallback(() => {
    setDevice(null);
  }, []);

  const onResult = useCallback(
    meta => {
      setDevice(null);
      const { inline } = route.params;
      const arg = { ...route.params, ...meta };
      if (inline) {
        navigation.replace(ScreenName.ReceiveAddAccount, arg);
      } else {
        navigation.navigate(ScreenName.ReceiveAddAccount, arg);
      }
    },
    [navigation, route],
  );

  useEffect(() => {
    // load ahead of time
    prepareCurrency(currency);
  }, [currency]);

  const analyticsPropertyFlow = route.params?.analyticsPropertyFlow;
  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <SkipSelectDevice route={route} onResult={setDevice} />
      {newDeviceSelectionFeatureFlag?.enabled ? (
        <Flex px={16} py={8} flex={1}>
          <SelectDevice2
            onSelect={setDevice}
            stopBleScanning={!!device || !isFocused}
          />
        </Flex>
      ) : (
        <NavigationScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContainer}
        >
          <TrackScreen
            category="AddAccounts"
            name="SelectDevice"
            currencyName={currency.name}
          />
          <SelectDevice onSelect={onSetDevice} />
        </NavigationScrollView>
      )}
      <DeviceActionModal
        action={action}
        device={device}
        onResult={onResult}
        onClose={onClose}
        request={{ currency }}
        onSelectDeviceLink={() => setDevice(null)}
        analyticsPropertyFlow={analyticsPropertyFlow || "add account"}
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
