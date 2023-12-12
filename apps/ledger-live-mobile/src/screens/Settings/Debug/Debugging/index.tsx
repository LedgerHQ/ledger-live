import React from "react";
import { useNavigation } from "@react-navigation/native";
import { IconsLegacy } from "@ledgerhq/native-ui";
import SettingsRow from "~/components/SettingsRow";
import { ScreenName } from "~/const";
import SettingsNavigationScrollView from "../../SettingsNavigationScrollView";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";

export default function Debugging() {
  const navigation = useNavigation<StackNavigatorNavigation<SettingsNavigatorStackParamList>>();

  return (
    <SettingsNavigationScrollView>
      <SettingsRow
        title="Logs"
        desc="View and export application logs."
        iconLeft={<IconsLegacy.LogsMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugLogs)}
      />
      <SettingsRow
        title="Application state"
        desc="View and override the app store data"
        iconLeft={<IconsLegacy.FullnodeMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugStore)}
      />
      <SettingsRow
        title="Network connectivity"
        desc="Check whether our services are reachable from here"
        iconLeft={<IconsLegacy.ServerMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugNetwork)}
      />
      <SettingsRow
        title="Crashes"
        desc="Trigger application crashes"
        iconLeft={<IconsLegacy.WarningSolidMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugCrash)}
      />
      <SettingsRow
        title="Camera permission"
        desc="Debug Camera permissions"
        iconLeft={<IconsLegacy.ClipboardListCheckMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugCameraPermissions)}
      />
      <SettingsRow
        title="Bluetooth and location services"
        desc="Bluetooth related permissions and enabled services checks"
        iconLeft={<IconsLegacy.ClipboardListCheckMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugBluetoothAndLocationServices)}
      />
    </SettingsNavigationScrollView>
  );
}
