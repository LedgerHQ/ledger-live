import React from "react";
import { useNavigation } from "@react-navigation/native";
import { Icons, Alert } from "@ledgerhq/native-ui";
import SettingsRow from "../../../../components/SettingsRow";
import { ScreenName } from "../../../../const";

import ReadOnlyModeRow from "./ReadOnlyModeRow";
import AnalyticsConsoleRow from "./AnalyticsConsoleRow";
import ThemeToggleRow from "./ThemeToggleRow";
import SkipLock from "../../../../components/behaviour/SkipLock";
import SettingsNavigationScrollView from "../../SettingsNavigationScrollView";
import MockModeRow from "../../General/MockModeRow";
import HasOrderedNanoRow from "./HasOrderedNanoRow";
import { StackNavigatorNavigation } from "../../../../components/RootNavigator/types/helpers";
import { SettingsNavigatorStackParamList } from "../../../../components/RootNavigator/types/SettingsNavigator";
import ResetOnboardingStateRow from "./ResetOnboardingStateRow";
import NftMetadataServiceRow from "./NftMetadataServiceRow";

export default function Configuration() {
  const navigation =
    useNavigation<StackNavigatorNavigation<SettingsNavigatorStackParamList>>();

  return (
    <SettingsNavigationScrollView>
      <SettingsRow
        title="Feature flags"
        desc="Read and override any remote settings."
        iconLeft={<Icons.ChartNetworkMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugFeatureFlags)}
      />
      <SettingsRow
        title="Environment variables"
        desc="Read and override any local settings."
        iconLeft={<Icons.MobileMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugEnv)}
      />
      <Alert type={"info"} title={"Quick toggles for common settings."} />
      <ResetOnboardingStateRow />
      <ReadOnlyModeRow />
      <HasOrderedNanoRow />
      <MockModeRow />
      <AnalyticsConsoleRow />
      <NftMetadataServiceRow />
      <ThemeToggleRow />
      <SkipLock />
    </SettingsNavigationScrollView>
  );
}
