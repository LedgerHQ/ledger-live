import React from "react";
import { IconsLegacy, Alert as AlertBox, Flex } from "@ledgerhq/native-ui";
import { TrackScreen } from "~/analytics";
import SettingsRow from "~/components/SettingsRow";
import { ScreenName } from "~/const";
import SettingsNavigationScrollView from "../SettingsNavigationScrollView";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";

export default function DebugSettings({
  navigation: { navigate },
}: StackNavigatorProps<SettingsNavigatorStackParamList, ScreenName.DebugSettings>) {
  return (
    <SettingsNavigationScrollView>
      <TrackScreen category="Settings" name="Debug" />
      <Flex p={6} pt={0}>
        <AlertBox type={"warning"} title={"Tools for development, debugging and QA."} />
      </Flex>
      <SettingsRow
        hasBorderTop
        title="Configuration"
        desc="Env variables, feature-flags, and toggles."
        iconLeft={<IconsLegacy.SettingsMedium size={24} color="black" />}
        onPress={() => navigate(ScreenName.DebugConfiguration)}
      />
      <SettingsRow
        title="Features & flows"
        desc="Specific flows and tools"
        iconLeft={<IconsLegacy.BoxMedium size={24} color="black" />}
        onPress={() => navigate(ScreenName.DebugFeatures)}
      />
      <SettingsRow
        title="Connectivity"
        desc="Transports, proxy, benchmarking, repl"
        iconLeft={<IconsLegacy.NanoXAltMedium size={24} color="black" />}
        onPress={() => navigate(ScreenName.DebugConnectivity)}
      />
      <SettingsRow
        title="Generators and Destructors"
        desc="Create new accounts, announcements, etc"
        iconLeft={<IconsLegacy.MicrochipMedium size={24} color="black" />}
        onPress={() => navigate(ScreenName.DebugGenerators)}
      />
      <SettingsRow
        title="Debugging"
        desc="Logs, application state, errors"
        iconLeft={<IconsLegacy.LogsMedium size={24} color="black" />}
        onPress={() => navigate(ScreenName.DebugDebugging)}
      />
      <SettingsRow
        title="Information"
        desc="Get information on your current setup"
        iconLeft={<IconsLegacy.InfoAltMedium size={24} color="black" />}
        onPress={() => navigate(ScreenName.DebugInformation)}
      />
      <SettingsRow
        title="Performance"
        desc="Get performance information about your setup"
        iconLeft={<IconsLegacy.BarChartMedium size={24} color="black" />}
        onPress={() => navigate(ScreenName.DebugPerformance)}
      />
      <SettingsRow
        title="Playground"
        desc="Easy to access blank debugging screen"
        iconLeft={<IconsLegacy.EmojiHappyMedium size={24} color="black" />}
        onPress={() => navigate(ScreenName.DebugPlayground)}
      />
    </SettingsNavigationScrollView>
  );
}
