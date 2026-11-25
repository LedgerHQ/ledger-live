import React, { useCallback } from "react";
import type { SettingsHomeSectionId } from "@features/flow-settings";
import { SettingsHomeGate } from "@features/flow-settings/native";
import { ScreenName } from "~/const";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import Settings from "~/screens/Settings";
import { useSettingsRowsToHide } from "../hooks/useSettingsRowsToHide";

type SettingsHomeScreenProps = StackNavigatorProps<
  SettingsNavigatorStackParamList,
  ScreenName.SettingsScreen
>;

export function SettingsHomeScreen({ navigation, route }: SettingsHomeScreenProps) {
  const rowsToHide = useSettingsRowsToHide();
  const onSelectSection = useCallback(
    (section: SettingsHomeSectionId) =>
      navigation.navigate(ScreenName.SettingsSection, { section }),
    [navigation],
  );

  return (
    <SettingsHomeGate
      onSelectSection={onSelectSection}
      legacySettings={<Settings navigation={navigation} route={route} />}
      rowsToHide={rowsToHide}
      testID="settings-home"
    />
  );
}
