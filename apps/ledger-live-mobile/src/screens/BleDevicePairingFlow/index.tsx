import { Device, DeviceModelId } from "@ledgerhq/types-devices";
import React, { useCallback } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { NavigatorName, ScreenName } from "~/const";
import BleDevicePairingFlowComponent, {
  SetHeaderOptionsRequest,
} from "~/components/BleDevicePairingFlow/index";
import {
  ReactNavigationHeaderOptions,
  RootComposite,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { NavigationHeaderBackButton } from "~/components/NavigationHeaderBackButton";
import { useIncrementOnNavigationFocusState } from "~/helpers/useIncrementOnNavigationFocusState";

export type Props = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.BleDevicePairingFlow>
>;

// Defines here some of the header options for this screen to be able to reset back to them.
export const bleDevicePairingFlowHeaderOptions: ReactNavigationHeaderOptions = {
  headerShown: true,
  headerLeft: () => <NavigationHeaderBackButton />,
  title: "",
  headerRight: () => null,
};

/**
 * Screen handling the BLE flow with a scanning step and a pairing step
 *
 * Note: this screen is only used from deep link sync-onboarding
 *
 * @returns a JSX component
 */
export const BleDevicePairingFlow: React.FC<Props> = ({ navigation }) => {
  const keyToReset = useIncrementOnNavigationFocusState<Props["navigation"]>(navigation);
  const onPairingSuccess = useCallback(
    (device: Device) => {
      // Navigates to the sync onboarding passing the newly paired device
      navigation.navigate(NavigatorName.BaseOnboarding, {
        screen: NavigatorName.SyncOnboarding,
        params: {
          screen: ScreenName.SyncOnboardingCompanion,
          params: { device },
        },
      });
    },
    [navigation],
  );

  const requestToSetHeaderOptions = useCallback(
    (request: SetHeaderOptionsRequest) => {
      if (request.type === "set") {
        navigation.setOptions({
          headerLeft: request.options.headerLeft,
          headerRight: request.options.headerRight,
        });
      } else {
        // Sets back the header to its initial values set for this screen
        navigation.setOptions(bleDevicePairingFlowHeaderOptions);
      }
    },
    [navigation],
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Flex px={6} flex={1}>
        <BleDevicePairingFlowComponent
          key={keyToReset}
          filterByDeviceModelId={DeviceModelId.stax}
          onPairingSuccess={onPairingSuccess}
          requestToSetHeaderOptions={requestToSetHeaderOptions}
        />
      </Flex>
    </SafeAreaView>
  );
};
