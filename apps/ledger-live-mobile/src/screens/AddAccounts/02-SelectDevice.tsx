import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, SafeAreaView } from "react-native";
import { useDispatch } from "react-redux";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { createAction } from "@ledgerhq/live-common/hw/actions/app";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import { useTheme } from "@react-navigation/native";
import { isTokenCurrency } from "@ledgerhq/live-common/currencies/index";
import { prepareCurrency } from "../../bridge/cache";
import { ScreenName } from "../../const";
import { TrackScreen } from "../../analytics";
import SelectDevice from "../../components/SelectDevice";
import NavigationScrollView from "../../components/NavigationScrollView";
import DeviceActionModal from "../../components/DeviceActionModal";
import type { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import type { AddAccountsNavigatorParamList } from "../../components/RootNavigator/types/AddAccountsNavigator";
import SkipSelectDevice from "../SkipSelectDevice";
import {
  setLastConnectedDevice,
  setReadOnlyMode,
} from "../../actions/settings";

type Props = StackNavigatorProps<
  AddAccountsNavigatorParamList,
  ScreenName.AddAccountsSelectDevice
>;

const action = createAction(connectApp);
export default function AddAccountsSelectDevice({ navigation, route }: Props) {
  const { currency, analyticsPropertyFlow } = route.params;
  const { colors } = useTheme();
  const [device, setDevice] = useState<Device | null | undefined>(null);
  const dispatch = useDispatch();
  const onSetDevice = useCallback(
    device => {
      dispatch(setLastConnectedDevice(device));
      setDevice(device);
      dispatch(setReadOnlyMode(false));
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
        navigation.replace(ScreenName.AddAccountsAccounts, arg);
      } else {
        navigation.navigate(ScreenName.AddAccountsAccounts, arg);
      }
    },
    [navigation, route],
  );
  useEffect(() => {
    // load ahead of time
    currency &&
      prepareCurrency(
        isTokenCurrency(currency) ? currency.parentCurrency : currency,
      );
  }, [currency]);
  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <NavigationScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContainer}
      >
        <TrackScreen
          category="AddAccounts"
          name="SelectDevice"
          currencyName={currency?.name}
        />
        <SkipSelectDevice route={route} onResult={setDevice} />
        <SelectDevice onSelect={onSetDevice} />
      </NavigationScrollView>
      <DeviceActionModal
        action={action}
        device={device}
        onResult={onResult}
        onClose={onClose}
        request={{
          currency:
            currency && isTokenCurrency(currency)
              ? currency.parentCurrency
              : currency,
        }}
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
