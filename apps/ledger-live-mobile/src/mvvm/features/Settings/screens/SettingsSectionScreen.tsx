import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import {
  HiddenSettingsProvider,
  SettingsPortProvider,
  type SettingsHomeSectionId,
} from "@features/flow-settings";
import { SettingsScrollView } from "@features/flow-settings/native";
import { General } from "@features/flow-settings-general/native";
import { NotificationsSettings } from "@features/flow-settings-notifications";
import { Privacy } from "@features/flow-settings-privacy";
import { Security } from "@features/flow-settings-security";
import type { ScreenName } from "~/const";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import { LedgerSyncActivationDrawer } from "../components/LedgerSyncActivationDrawer";
import { useSectionRowsToHide } from "../hooks/useSectionRowsToHide";
import { MobileSettingsPortProvider } from "../MobileSettingsPortProvider";
import { useNotificationsSettingsAdapter } from "../sections/notifications";
import { usePrivacySettingsAdapter } from "../sections/privacy";

type SettingsSectionScreenProps = StackNavigatorProps<
  SettingsNavigatorStackParamList,
  ScreenName.SettingsSection
>;

function NotificationsSection() {
  const port = useNotificationsSettingsAdapter();
  return (
    <SettingsPortProvider value={port}>
      <NotificationsSettings testID="settings-notifications" />
    </SettingsPortProvider>
  );
}

function PrivacySection() {
  const port = usePrivacySettingsAdapter();
  return (
    <Box lx={{ paddingHorizontal: "s8" }}>
      <SettingsPortProvider value={port}>
        <Privacy testID="settings-privacy" />
      </SettingsPortProvider>
    </Box>
  );
}

function SectionContent({ section }: Readonly<{ section: SettingsHomeSectionId }>) {
  switch (section) {
    case "general":
      return (
        <Box lx={{ paddingHorizontal: "s8" }}>
          <MobileSettingsPortProvider>
            <General testID="settings-general" />
            <LedgerSyncActivationDrawer />
          </MobileSettingsPortProvider>
        </Box>
      );
    case "security":
      return (
        <Box lx={{ paddingHorizontal: "s8" }}>
          <MobileSettingsPortProvider>
            <Security testID="settings-security" />
          </MobileSettingsPortProvider>
        </Box>
      );
    case "notifications":
      return <NotificationsSection />;
    case "privacy":
      return <PrivacySection />;
    default:
      return null;
  }
}

/** Shows the content of each section that has landed; the others stay empty. */
export function SettingsSectionScreen({ route }: SettingsSectionScreenProps) {
  const { section } = route.params;
  const rowsToHide = useSectionRowsToHide();

  return (
    <HiddenSettingsProvider rowsToHide={rowsToHide}>
      <SettingsScrollView testID={`settings-section-${section}`}>
        <SectionContent section={section} />
      </SettingsScrollView>
    </HiddenSettingsProvider>
  );
}
