import React from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { HiddenSettingsProvider } from "@features/flow-settings";
import { Security } from "@features/flow-settings-security";
import type { ScreenName } from "~/const";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import { useSettingsRowsToHide } from "../hooks/useSettingsRowsToHide";
import { MobileSettingsPortProvider } from "../MobileSettingsPortProvider";

type SettingsSectionScreenProps = StackNavigatorProps<
  SettingsNavigatorStackParamList,
  ScreenName.SettingsSection
>;

/** Shows the content of each section that has landed; the others stay empty. */
export function SettingsSectionScreen({ route }: SettingsSectionScreenProps) {
  const { section } = route.params;
  const rowsToHide = useSettingsRowsToHide();
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <HiddenSettingsProvider rowsToHide={rowsToHide}>
      <ScrollView
        alwaysBounceVertical={false}
        contentContainerStyle={{ paddingBottom: bottomInset }}
      >
        <Box lx={{ paddingHorizontal: "s8" }} testID={`settings-section-${section}`}>
          {section === "security" ? (
            <MobileSettingsPortProvider>
              <Security testID="settings-security" />
            </MobileSettingsPortProvider>
          ) : null}
        </Box>
      </ScrollView>
    </HiddenSettingsProvider>
  );
}
