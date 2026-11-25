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
  /**
   * Content of a section. The app composes it from the section packages, so the shell never
   * imports one. Empty while a section has no content yet.
   */
  renderSection?: (section: SettingsSectionId) => ReactNode;
  testID?: string;
}>;

/** Shows the new Settings page behind the flag, or the legacy Settings. */
export function SettingsGate({
  subPath,
  onSelectSection,
  legacySettings,
  rowsToHide,
  renderSection,
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
        {renderSection?.(selectedSection) ?? null}
      </SettingsPage>
    </HiddenSettingsProvider>
  );
}
