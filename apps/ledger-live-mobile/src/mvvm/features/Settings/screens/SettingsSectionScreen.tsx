import React from "react";
import { View } from "react-native";
import type { ScreenName } from "~/const";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";

type SettingsSectionScreenProps = StackNavigatorProps<
  SettingsNavigatorStackParamList,
  ScreenName.SettingsSection
>;

/** Empty until each section ticket brings its content (General first). */
export function SettingsSectionScreen({ route }: SettingsSectionScreenProps) {
  return <View testID={`settings-section-${route.params.section}`} />;
}
