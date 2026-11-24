import { useCallback, useMemo } from "react";
import { useSettingsLabels } from "../../copy/useSettingsLabels";
import {
  SETTINGS_SECTIONS,
  resolveSettingsSection,
  type SettingsSectionId,
} from "../../logic/settingsSections";

type SettingsPageViewModelInput = Readonly<{
  selectedSection: SettingsSectionId;
  onSelectSection: (section: SettingsSectionId) => void;
}>;

export type SettingsPageTab = Readonly<{ id: SettingsSectionId; label: string }>;

export type SettingsPageViewModel = Readonly<{
  title: string;
  tabs: readonly SettingsPageTab[];
  selectedSection: SettingsSectionId;
  onSelectTab: (tabId: string) => void;
}>;

export function useSettingsPageViewModel({
  selectedSection,
  onSelectSection,
}: SettingsPageViewModelInput): SettingsPageViewModel {
  const labels = useSettingsLabels();
  const tabs = useMemo(
    () => SETTINGS_SECTIONS.map(id => ({ id, label: labels.sections[id] })),
    [labels],
  );
  const onSelectTab = useCallback(
    (tabId: string) => onSelectSection(resolveSettingsSection(tabId)),
    [onSelectSection],
  );

  return { title: labels.title, tabs, selectedSection, onSelectTab };
}
