import React, { useCallback, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { Box, IconsLegacy, Alert, Flex } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import SettingsRow from "~/components/SettingsRow";
import { ScreenName } from "~/const";
import SelectDevice, { SetHeaderOptionsRequest } from "~/components/SelectDevice2";
import SettingsNavigationScrollView from "../../SettingsNavigationScrollView";
import {
  ReactNavigationHeaderOptions,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import { NavigationHeaderBackButton } from "~/components/NavigationHeaderBackButton";

// Defines here some of the header options for this screen to be able to reset back to them.
export const connectivityHeaderOptions: ReactNavigationHeaderOptions = {
  headerShown: true,
  title: "Connectivity",
  headerRight: () => null,
  headerLeft: () => <NavigationHeaderBackButton />,
};

export default function Connectivity() {
  const navigation = useNavigation<StackNavigatorNavigation<SettingsNavigatorStackParamList>>();
  const [device, setDevice] = useState<Device | null>(null);

  const requestToSetHeaderOptions = useCallback(
    (request: SetHeaderOptionsRequest) => {
      if (request.type === "set") {
        navigation.setOptions({
          headerLeft: request.options.headerLeft,
          headerRight: request.options.headerRight,
        });
      } else {
        // Sets back the header to its initial values set for this screen
        navigation.setOptions(connectivityHeaderOptions);
      }
    },
    [navigation],
  );

  return (
    <SettingsNavigationScrollView>
      <SettingsRow
        title="HTTP Transport"
        desc="Configure how LLM sees a proxy device"
        iconLeft={<IconsLegacy.DevicesAltMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugHttpTransport)}
      />
      {!device ? (
        <Box p={6}>
          <SelectDevice
            onSelect={setDevice}
            stopBleScanning={!!device}
            requestToSetHeaderOptions={requestToSetHeaderOptions}
          />
        </Box>
      ) : (
        <Flex>
          <Alert type="info" title="The following actions will use the selected device" />
          <SettingsRow
            title="Ble tool"
            desc={`Debugging tool using ${device.deviceName || device.deviceId}`}
            iconLeft={<IconsLegacy.BluetoothMedium size={32} color="black" />}
            onPress={() =>
              navigation.navigate(ScreenName.DebugBLE, {
                deviceId: device.deviceId,
              })
            }
          />
          <SettingsRow
            title="Command sender"
            desc={"Send commands to the device and get a response"}
            iconLeft={<IconsLegacy.ToolboxMedium size={32} color="black" />}
            onPress={() =>
              navigation.navigate(ScreenName.DebugCommandSender, {
                deviceId: device.deviceId,
              })
            }
          />
        </Flex>
      )}
    </SettingsNavigationScrollView>
  );
}
