import type { SettingsAboutProps, SettingsAboutViewProps } from "./SettingsAbout.types";

export function useSettingsAboutViewModel({ testID }: SettingsAboutProps): SettingsAboutViewProps {
  return { rows: [], testID };
}
