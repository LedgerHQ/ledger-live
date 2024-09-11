import React, { useCallback, useEffect } from "react";
import { StyleSheet, SafeAreaView } from "react-native";
import { useIsFocused, useTheme } from "@react-navigation/native";
import { isTokenCurrency } from "@ledgerhq/live-common/currencies/index";
import { Flex } from "@ledgerhq/native-ui";
import { prepareCurrency } from "~/bridge/cache";
import { ScreenName } from "~/const";
import SelectDevice2, { SetHeaderOptionsRequest } from "~/components/SelectDevice2";
import DeviceActionModal from "~/components/DeviceActionModal";
import type {
  ReactNavigationHeaderOptions,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import type { AddAccountsNavigatorParamList } from "~/components/RootNavigator/types/AddAccountsNavigator";
import SkipSelectDevice from "../SkipSelectDevice";
import AddAccountsHeaderRightClose from "./AddAccountsHeaderRightClose";
import { NavigationHeaderBackButton } from "~/components/NavigationHeaderBackButton";
import { useAppDeviceAction, useSelectDevice } from "~/hooks/deviceActions";

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
  const { device, selectDevice, registerDeviceSelection } = useSelectDevice();
  const isFocused = useIsFocused();

  const onClose = useCallback(() => {
    selectDevice(null);
  }, [selectDevice]);

  const onResult = useCallback(
    // @ts-expect-error should be AppResult but navigation.navigate does not agree
    meta => {
      selectDevice(null);
      const { inline } = route.params;
      const arg = { ...route.params, ...meta };

      if (inline) {
        navigation.replace(ScreenName.AddAccountsAccounts, arg);
      } else {
        navigation.navigate(ScreenName.AddAccountsAccounts, arg);
      }
    },
    [selectDevice, navigation, route],
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
      <SkipSelectDevice route={route} onResult={selectDevice} />
      <Flex px={16} py={8} flex={1}>
        <SelectDevice2
          onSelect={selectDevice}
          stopBleScanning={!!device || !isFocused}
          requestToSetHeaderOptions={requestToSetHeaderOptions}
        />
      </Flex>
      <DeviceActionModal
        action={action}
        device={device}
        onResult={onResult}
        onClose={onClose}
        request={{
          currency: currency && isTokenCurrency(currency) ? currency.parentCurrency : currency,
        }}
        onSelectDeviceLink={() => selectDevice(null)}
        analyticsPropertyFlow={analyticsPropertyFlow || "add account"}
        registerDeviceSelection={registerDeviceSelection}
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
