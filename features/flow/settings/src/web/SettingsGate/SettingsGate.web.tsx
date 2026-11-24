import React, { type ReactNode } from "react";
import { HiddenSettingsProvider } from "../../components/HiddenSettingsProvider/HiddenSettingsProvider";
import type { SettingsSectionId } from "../../logic/settingsSections";
import { SettingsPage } from "../SettingsPage/SettingsPage";
import { useSettingsGateViewModel } from "./useSettingsGateViewModel";

export type SettingsGateProps = Readonly<{
  /** The address after `/settings/`, e.g. `security` or `developer/info-state-qa`. */
  subPath: string;
  onSelectSection: (section: SettingsSectionId) => void;
  /** Shown while the new Settings are off, and for the sections they do not cover yet. */
  legacySettings: ReactNode;
  /** Rows the app hides, given to `HiddenSettingsProvider`. */
  rowsToHide: unknown;
  testID?: string;
}>;

/** Shows the new Settings page behind the flag, or the legacy Settings. */
export function SettingsGate({
  subPath,
  onSelectSection,
  legacySettings,
  rowsToHide,
  testID,
}: SettingsGateProps) {
  const { showLegacySettings, selectedSection } = useSettingsGateViewModel(subPath);

  if (showLegacySettings) return <>{legacySettings}</>;

  return (
    <HiddenSettingsProvider rowsToHide={rowsToHide}>
      <SettingsPage
        selectedSection={selectedSection}
        onSelectSection={onSelectSection}
        testID={testID}
      >
        {null}
      </SettingsPage>
    </HiddenSettingsProvider>
  );
}
