import React from "react";
import { useNavigation } from "@react-navigation/native";
import { IconsLegacy, Alert, Flex } from "@ledgerhq/native-ui";
import SettingsRow from "~/components/SettingsRow";
import { ScreenName } from "~/const";

import ReadOnlyModeRow from "./ReadOnlyModeRow";
import AnalyticsConsoleRow from "./AnalyticsConsoleRow";
import ThemeToggleRow from "./ThemeToggleRow";
import SkipLock from "~/components/behaviour/SkipLock";
import SettingsNavigationScrollView from "../../SettingsNavigationScrollView";
import MockModeRow from "../../General/MockModeRow";
import HasOrderedNanoRow from "./HasOrderedNanoRow";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import ResetOnboardingStateRow from "./ResetOnboardingStateRow";
import NftMetadataServiceRow from "./NftMetadataServiceRow";
import HasStaxRow from "./HasStaxRow";

export default function Configuration() {
  const navigation = useNavigation<StackNavigatorNavigation<SettingsNavigatorStackParamList>>();

  return (
    <SettingsNavigationScrollView>
      <SettingsRow
        title="Feature flags"
        desc="Read and override any remote settings."
        iconLeft={<IconsLegacy.ChartNetworkMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugFeatureFlags)}
      />
      <SettingsRow
        title="Environment variables"
        desc="Read and override any local settings."
        iconLeft={<IconsLegacy.MobileMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugEnv)}
      />
      <Flex p={6}>
        <Alert type={"info"} title={"Quick toggles for common settings."} />
      </Flex>
      <ResetOnboardingStateRow />
      <ReadOnlyModeRow />
      <HasOrderedNanoRow />
      <HasStaxRow />
      <MockModeRow />
      <AnalyticsConsoleRow />
      <NftMetadataServiceRow />
      <ThemeToggleRow />
      <SkipLock />
    </SettingsNavigationScrollView>
  );
}
