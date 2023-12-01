import React, { useCallback } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { Device } from "@ledgerhq/types-devices";

import { ScreenName } from "~/const";
import BleDevicePairingFlowComponent, {
  SetHeaderOptionsRequest,
} from "~/components/BleDevicePairingFlow";
import { bleDevicePairingFlowHeaderOptions } from "../../../BleDevicePairingFlow";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import { RootComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

export type Props = RootComposite<
  StackNavigatorProps<SettingsNavigatorStackParamList, ScreenName.DebugBLEDevicePairing>
>;

const BleDevicePairingScreen: React.FC<Props> = ({ navigation, route }) => {
  const { onSuccessAddToKnownDevices, filterByDeviceModelId, areKnownDevicesDisplayed } =
    route.params;

  const onPairingSuccess = useCallback(
    (device: Device) => {
      navigation.navigate(ScreenName.DebugFeatures, { pairedDevice: device });
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
          areKnownDevicesDisplayed={areKnownDevicesDisplayed}
          onPairingSuccessAddToKnownDevices={onSuccessAddToKnownDevices}
          filterByDeviceModelId={filterByDeviceModelId}
          onPairingSuccess={onPairingSuccess}
          requestToSetHeaderOptions={requestToSetHeaderOptions}
        />
      </Flex>
    </SafeAreaView>
  );
};

export default BleDevicePairingScreen;
