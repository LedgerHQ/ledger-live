import React, { useCallback } from "react";
import { StyleSheet, SafeAreaView } from "react-native";
import { Flex } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { track } from "~/analytics";
import SelectDevice, { SetHeaderOptionsRequest } from "~/components/SelectDevice2";
import DeviceActionModal from "~/components/DeviceActionModal";

import {
  ReactNavigationHeaderOptions,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { NavigationHeaderCloseButtonAdvanced } from "~/components/NavigationHeaderCloseButton";
import { NavigationHeaderBackButton } from "~/components/NavigationHeaderBackButton";
import { DeviceSelectionNavigatorParamsList } from "../../types";
import { NetworkBasedAddAccountNavigator } from "LLM/features/Accounts/screens/AddAccount/types";
import useSelectDeviceViewModel from "./useSelectDeviceViewModel";

// Defines some of the header options for this screen to be able to reset back to them.
export const addAccountsSelectDeviceHeaderOptions = (
  onClose: () => void,
): ReactNavigationHeaderOptions => ({
  headerRight: () => <NavigationHeaderCloseButtonAdvanced onClose={onClose} />,
  headerLeft: () => <NavigationHeaderBackButton />,
});

export default function SelectDeviceScreen({
  route,
  navigation,
}: StackNavigatorProps<
  DeviceSelectionNavigatorParamsList & Partial<NetworkBasedAddAccountNavigator>,
  ScreenName.SelectDevice
>) {
  const { currency } = route.params;
  const { onResult, device, action, isFocused, onClose, selectDevice, registerDeviceSelection } =
    useSelectDeviceViewModel(route);
  const { colors } = useTheme();
  const analyticsPropertyFlow = route.params?.analyticsPropertyFlow;
  const onHeaderCloseButton = useCallback(() => {
    track("button_clicked", {
      button: "Close 'x'",
      page: route.name,
    });
  }, [route]);

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
          ...addAccountsSelectDeviceHeaderOptions(onHeaderCloseButton),
        });
      }
    },
    [navigation, onHeaderCloseButton],
  );

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
      <Flex px={16} py={8} flex={1}>
        <SelectDevice
          onSelect={selectDevice}
          stopBleScanning={!!device || !isFocused}
          requestToSetHeaderOptions={requestToSetHeaderOptions}
          autoSelectLastConnectedDevice={!forceSelectDevice}
        />
      </Flex>
      <DeviceActionModal
        action={action}
        device={device}
        onResult={onResult}
        onClose={onClose}
        request={{ currency }}
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
