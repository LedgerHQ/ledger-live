import React, { type ReactNode } from "react";
import type { SettingsSectionId } from "../../logic/settingsSections";
import { SettingsPageView } from "./SettingsPageView";
import { useSettingsPageViewModel } from "./useSettingsPageViewModel";

export type SettingsPageProps = Readonly<{
  selectedSection: SettingsSectionId;
  onSelectSection: (section: SettingsSectionId) => void;
  children: ReactNode;
  testID?: string;
}>;

export function SettingsPage({
  selectedSection,
  onSelectSection,
  children,
  testID,
}: SettingsPageProps) {
  const viewModel = useSettingsPageViewModel({ selectedSection, onSelectSection });
  return (
    <SettingsPageView {...viewModel} testID={testID}>
      {children}
    </SettingsPageView>
  );
}
