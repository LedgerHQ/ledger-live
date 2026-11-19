import { useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { useFeature } from "@features/platform-feature-flags";
import { resolveSettingsSection, type SettingsSectionId } from "@features/flow-settings";

const SECTIONS_STILL_ON_LEGACY_SETTINGS = new Set(["help", "experimental", "developer"]);

const NO_ROWS_TO_HIDE: readonly string[] = [];

export type NewSettingsViewModel = Readonly<{
  showLegacySettings: boolean;
  selectedSection: SettingsSectionId;
  onSelectSection: (section: SettingsSectionId) => void;
  rowsToHide: readonly string[];
}>;

export function useNewSettingsViewModel(): NewSettingsViewModel {
  const newSettings = useFeature("newSettings");
  const navigate = useNavigate();
  const { "*": subPath = "" } = useParams();
  const [requestedSection] = subPath.split("/");

  const onSelectSection = useCallback(
    (section: SettingsSectionId) => navigate(`/settings/${section}`),
    [navigate],
  );

  return {
    showLegacySettings:
      !newSettings?.enabled || SECTIONS_STILL_ON_LEGACY_SETTINGS.has(requestedSection),
    selectedSection: resolveSettingsSection(requestedSection),
    onSelectSection,
    rowsToHide: NO_ROWS_TO_HIDE,
  };
}
