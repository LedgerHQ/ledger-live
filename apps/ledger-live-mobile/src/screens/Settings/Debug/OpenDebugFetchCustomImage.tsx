import React from "react";
import { useNavigation } from "@react-navigation/native";
import { FeatureToggle } from "@ledgerhq/live-common/featureFlags/index";
import { ScreenName } from "../../../const";
import SettingsRow from "../../../components/SettingsRow";
import { StackNavigatorNavigation } from "../../../components/RootNavigator/types/helpers";
import { SettingsNavigatorStackParamList } from "../../../components/RootNavigator/types/SettingsNavigator";

export default function OpenDebugFetchCustomImage() {
  const navigation =
    useNavigation<StackNavigatorNavigation<SettingsNavigatorStackParamList>>();

  return (
    <FeatureToggle feature="customImage" fallback={null}>
      <SettingsRow
        title="Debug Custom Image - Fetch & Backup"
        desc="Backing up and skipping included"
        onPress={() => navigation.navigate(ScreenName.DebugFetchCustomImage)}
      />
    </FeatureToggle>
  );
}
