import { SafeAreaView } from "react-native-safe-area-context";
import { Flex } from "@ledgerhq/native-ui";
import BleDevicePairingFlowComponent, {
  SetHeaderOptionsRequest,
} from "~/components/BleDevicePairingFlow";
import React, { useCallback } from "react";
import { Device } from "@ledgerhq/types-devices";
import { NavigatorName, ScreenName } from "~/const";
import { RootComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import { useSelector } from "react-redux";
import { hasCompletedOnboardingSelector } from "~/reducers/settings";
import { bleDevicePairingFlowHeaderOptions } from "~/screens/BleDevicePairingFlow";

export type Props = RootComposite<
  StackNavigatorProps<OnboardingNavigatorParamList, ScreenName.OnboardingBleDevicePairingFlow>
>;

const OnboardingBleDevicePairingFlow: React.FC<Props> = ({ navigation, route }) => {
  const { filterByDeviceModelId } = route.params;

  const onPairingSuccess = useCallback(
    (device: Device) => {
      navigation.push(NavigatorName.BaseOnboarding, {
        screen: NavigatorName.SyncOnboarding,
        params: {
          screen: ScreenName.SyncOnboardingCompanion,
          params: {
            device,
          },
        },
      });
    },
    [navigation],
  );
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);

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
          areKnownDevicesDisplayed
          areKnownDevicesPairable={!hasCompletedOnboarding}
          filterByDeviceModelId={filterByDeviceModelId}
          onPairingSuccess={onPairingSuccess}
          requestToSetHeaderOptions={requestToSetHeaderOptions}
        />
      </Flex>
    </SafeAreaView>
  );
};

export default OnboardingBleDevicePairingFlow;
