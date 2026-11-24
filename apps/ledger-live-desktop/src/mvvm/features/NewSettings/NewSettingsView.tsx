import React from "react";
import { HiddenSettingsProvider, type SettingsSectionId } from "@features/flow-settings";
import { SettingsPage } from "@features/flow-settings/web";

type NewSettingsViewProps = Readonly<{
  selectedSection: SettingsSectionId;
  onSelectSection: (section: SettingsSectionId) => void;
  rowsToHide: readonly string[];
}>;

export function NewSettingsView({
  selectedSection,
  onSelectSection,
  rowsToHide,
}: NewSettingsViewProps) {
  return (
    <HiddenSettingsProvider rowsToHide={rowsToHide}>
      <SettingsPage
        selectedSection={selectedSection}
        onSelectSection={onSelectSection}
        testID="new-settings-page"
      >
        {null}
      </SettingsPage>
    </HiddenSettingsProvider>
  );
}
