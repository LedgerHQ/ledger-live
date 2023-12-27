import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, SafeAreaView } from "react-native";
import { useDispatch } from "react-redux";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { useIsFocused, useTheme } from "@react-navigation/native";
import { isTokenCurrency } from "@ledgerhq/live-common/currencies/index";
import { Flex } from "@ledgerhq/native-ui";
import { prepareCurrency } from "~/bridge/cache";
import { ScreenName } from "~/const";
import { TrackScreen } from "~/analytics";
import SelectDevice from "~/components/SelectDevice";
import SelectDevice2, { SetHeaderOptionsRequest } from "~/components/SelectDevice2";
import NavigationScrollView from "~/components/NavigationScrollView";
import DeviceActionModal from "~/components/DeviceActionModal";
import type {
  ReactNavigationHeaderOptions,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import type { AddAccountsNavigatorParamList } from "~/components/RootNavigator/types/AddAccountsNavigator";
import SkipSelectDevice from "../SkipSelectDevice";
import { setLastConnectedDevice, setReadOnlyMode } from "~/actions/settings";
import AddAccountsHeaderRightClose from "./AddAccountsHeaderRightClose";
import { NavigationHeaderBackButton } from "~/components/NavigationHeaderBackButton";
import { useAppDeviceAction } from "~/hooks/deviceActions";

type Props = StackNavigatorProps<AddAccountsNavigatorParamList, ScreenName.AddAccountsSelectDevice>;

// Defines some of the header options for this screen.
// headerRight and headerLeft for this screen were originally set by its associated Stack.Navigator.
export const addAccountsSelectDeviceHeaderOptions: ReactNavigationHeaderOptions = {
  headerShown: true,
  headerRight: AddAccountsHeaderRightClose,
  headerLeft: () => <NavigationHeaderBackButton />,
};

export default function AddAccountsSelectDevice({ navigation, route }: Props) {
  const action = useAppDeviceAction();
  const { currency, analyticsPropertyFlow } = route.params;
  const { colors } = useTheme();
  const [device, setDevice] = useState<Device | null | undefined>(null);
  const dispatch = useDispatch();

  const isFocused = useIsFocused();
  const newDeviceSelectionFeatureFlag = useFeature("llmNewDeviceSelection");

  const onSetDevice = useCallback(
    (device: Device) => {
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
    // @ts-expect-error should be AppResult but navigation.navigate does not agree
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
    currency && prepareCurrency(isTokenCurrency(currency) ? currency.parentCurrency : currency);
  }, [currency]);

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
          ...addAccountsSelectDeviceHeaderOptions,
        });
      }
    },
    [navigation],
  );

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
            requestToSetHeaderOptions={requestToSetHeaderOptions}
          />
        </Flex>
      ) : (
        <NavigationScrollView style={styles.scroll} contentContainerStyle={styles.scrollContainer}>
          <TrackScreen category="AddAccounts" name="SelectDevice" currencyName={currency?.name} />
          <SelectDevice onSelect={onSetDevice} />
        </NavigationScrollView>
      )}
      <DeviceActionModal
        action={action}
        device={device}
        onResult={onResult}
        onClose={onClose}
        request={{
          currency: currency && isTokenCurrency(currency) ? currency.parentCurrency : currency,
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
