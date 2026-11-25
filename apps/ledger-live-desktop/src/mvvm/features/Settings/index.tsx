import React, { useCallback, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router";
import type { SettingsSectionId } from "@features/flow-settings";
import { SettingsGate } from "@features/flow-settings/web";
import { DesktopSettingsPortProvider } from "./DesktopSettingsPortProvider";

const NO_ROWS_TO_HIDE: readonly string[] = [];

type SettingsRouteProps = Readonly<{ legacySettings: ReactNode }>;

export function SettingsRoute({ legacySettings }: SettingsRouteProps) {
  const navigate = useNavigate();
  const { "*": subPath = "" } = useParams();
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
        rowsToHide={NO_ROWS_TO_HIDE}
        testID="settings-page"
      />
    </DesktopSettingsPortProvider>
  );
}
