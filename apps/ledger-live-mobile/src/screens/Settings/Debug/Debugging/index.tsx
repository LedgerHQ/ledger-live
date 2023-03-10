import React from "react";
import { useNavigation } from "@react-navigation/native";
import { Icons } from "@ledgerhq/native-ui";
import SettingsRow from "../../../../components/SettingsRow";
import { ScreenName } from "../../../../const";
import SettingsNavigationScrollView from "../../SettingsNavigationScrollView";
import { StackNavigatorNavigation } from "../../../../components/RootNavigator/types/helpers";
import { SettingsNavigatorStackParamList } from "../../../../components/RootNavigator/types/SettingsNavigator";

export default function Debugging() {
  const navigation =
    useNavigation<StackNavigatorNavigation<SettingsNavigatorStackParamList>>();

  return (
    <SettingsNavigationScrollView>
      <SettingsRow
        title="Logs"
        desc="View and export application logs."
        iconLeft={<Icons.LogsMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugLogs)}
      />
      <SettingsRow
        title="Application state"
        desc="View and override the app store data"
        iconLeft={<Icons.FullnodeMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugStore)}
      />
      <SettingsRow
        title="Network connectivity"
        desc="Check whether our services are reachable from here"
        iconLeft={<Icons.ServerMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugNetwork)}
      />
      <SettingsRow
        title="Crashes"
        desc="Trigger application crashes"
        iconLeft={<Icons.WarningSolidMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugCrash)}
      />
      <SettingsRow
        title="Camera permission"
        desc="Debug Camera permissions"
        iconLeft={<Icons.ClipboardListCheckMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugCameraPermissions)}
      />
      <SettingsRow
        title="Bluetooth and location services"
        desc="Bluetooth related permissions and enabled services checks"
        iconLeft={<Icons.ClipboardListCheckMedium size={32} color="black" />}
        onPress={() =>
          navigation.navigate(ScreenName.DebugBluetoothAndLocationServices)
        }
      />
    </SettingsNavigationScrollView>
  );
}
