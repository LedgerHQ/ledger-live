import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { Box, Icons, Alert, Flex } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import SettingsRow from "../../../../components/SettingsRow";
import { ScreenName } from "../../../../const";
import SelectDevice from "../../../../components/SelectDevice2";
import SettingsNavigationScrollView from "../../SettingsNavigationScrollView";
import { StackNavigatorNavigation } from "../../../../components/RootNavigator/types/helpers";
import { SettingsNavigatorStackParamList } from "../../../../components/RootNavigator/types/SettingsNavigator";

export default function Connectivity() {
  const navigation =
    useNavigation<StackNavigatorNavigation<SettingsNavigatorStackParamList>>();
  const [device, setDevice] = useState<Device | null>(null);

  return (
    <SettingsNavigationScrollView>
      <SettingsRow
        title="HTTP Transport"
        desc="Configure how LLM sees a proxy device"
        iconLeft={<Icons.DevicesAltMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugHttpTransport)}
      />
      {!device ? (
        <Box p={6}>
          <SelectDevice onSelect={setDevice} stopBleScanning={!!device} />
        </Box>
      ) : (
        <Flex>
          <Alert
            type="info"
            title="The following actions will use the selected device"
          />
          <SettingsRow
            title="Ble tool"
            desc={`Debugging tool using ${
              device.deviceName || device.deviceId
            }`}
            iconLeft={<Icons.BluetoothMedium size={32} color="black" />}
            onPress={() =>
              navigation.navigate(ScreenName.DebugBLE, {
                deviceId: device.deviceId,
              })
            }
          />
          <SettingsRow
            title="Command sender"
            desc={"Send commands to the device and get a response"}
            iconLeft={<Icons.ToolboxMedium size={32} color="black" />}
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
