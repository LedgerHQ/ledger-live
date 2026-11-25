import React from "react";
import { View } from "react-native";
import { HiddenSettingsProvider } from "@features/flow-settings";
import type { ScreenName } from "~/const";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import { useSettingsRowsToHide } from "../hooks/useSettingsRowsToHide";

type SettingsSectionScreenProps = StackNavigatorProps<
  SettingsNavigatorStackParamList,
  ScreenName.SettingsSection
>;

/** Empty until each section ticket brings its content (General first). */
export function SettingsSectionScreen({ route }: SettingsSectionScreenProps) {
  const rowsToHide = useSettingsRowsToHide();

  return (
    <HiddenSettingsProvider rowsToHide={rowsToHide}>
      <View testID={`settings-section-${route.params.section}`} />
    </HiddenSettingsProvider>
  );
}
