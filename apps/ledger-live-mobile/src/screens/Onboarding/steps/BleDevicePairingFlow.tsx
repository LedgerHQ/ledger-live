import SafeAreaView from "~/components/SafeAreaView";
import { Flex } from "@ledgerhq/native-ui";
import BleDevicePairingFlowComponent, {
  SetHeaderOptionsRequest,
} from "~/components/BleDevicePairingFlow";
import React, { useCallback } from "react";
import { DevicesWithTouchScreen } from "@ledgerhq/device-core";
import { Device, DeviceModelId } from "@ledgerhq/types-devices";
import { DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { useFeature } from "@features/platform-feature-flags";
import { NavigatorName, ScreenName } from "~/const";
import { RootComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import { useSelector } from "~/context/hooks";
import { hasCompletedOnboardingSelector } from "~/reducers/settings";
import { bleDevicePairingFlowHeaderOptions } from "~/screens/BleDevicePairingFlow";

export type Props = RootComposite<
  StackNavigatorProps<OnboardingNavigatorParamList, ScreenName.OnboardingBleDevicePairingFlow>
>;

const OnboardingBleDevicePairingFlow: React.FC<Props> = ({ navigation, route }) => {
  const isApexSupported = useFeature("supportDeviceApex")?.enabled ?? false;
  // The sync-onboarding deep link carries no params: only touchscreen devices can open it
  const filterByDeviceModelId =
    route.params?.filterByDeviceModelId ??
    DevicesWithTouchScreen.filter(
      deviceModelId => isApexSupported || deviceModelId !== DeviceModelId.apex,
    );

  const onPairingSuccess = useCallback(
    // _discoveredDevice will be used for DMK-based device connections. Do not remove.
    (device: Device, _discoveredDevice: DiscoveredDevice) => {
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
          isOnboarding
        />
      </Flex>
    </SafeAreaView>
  );
};

export default OnboardingBleDevicePairingFlow;
