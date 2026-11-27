import React, { useCallback, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router";
import {
  useApolloHiddenSettings,
  type SettingsSectionId,
  type SettingsStandalonePage,
} from "@features/flow-settings";
import { SettingsGate } from "@features/flow-settings/web";
import { SettingsAbout } from "@features/flow-settings-about";
import { General } from "@features/flow-settings-general/web";
import { Privacy } from "@features/flow-settings-privacy";
import { Security } from "@features/flow-settings-security";
import { DesktopSettingsPortProvider } from "./DesktopSettingsPortProvider";
import { DesktopHelpPage } from "./sections/help";

/** Apollo is an Android device: desktop only hides the rows the flag params turn on. */
const IS_APOLLO_DEVICE = false;

function renderSection(section: SettingsSectionId) {
  switch (section) {
    case "general":
      return <General testID="settings-general" />;
    case "security":
      return <Security testID="settings-security" />;
    case "privacy":
      return <Privacy testID="settings-privacy" />;
    case "about":
      return <SettingsAbout testID="settings-about" />;
    default:
      return null;
  }
}

const renderStandalonePage = (page: SettingsStandalonePage) =>
  page === "help" ? <DesktopHelpPage /> : null;

type SettingsRouteProps = Readonly<{ legacySettings: ReactNode }>;

export function SettingsRoute({ legacySettings }: SettingsRouteProps) {
  const navigate = useNavigate();
  const { "*": subPath = "" } = useParams();
  const rowsToHide = useApolloHiddenSettings(IS_APOLLO_DEVICE);
  const onSelectSection = useCallback(
    (section: SettingsSectionId) => navigate(`/settings/${section}`),
    [navigate],
  );

  return (
    <DesktopSettingsPortProvider>
      <SettingsGate
        subPath={subPath}
        onSelectSection={onSelectSection}
        legacySettings={legacySettings}
        rowsToHide={rowsToHide}
        renderSection={renderSection}
        renderStandalonePage={renderStandalonePage}
        testID="settings-page"
      />
    </DesktopSettingsPortProvider>
  );
}
