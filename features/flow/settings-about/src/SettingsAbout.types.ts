import type { SettingsRowProps } from "@features/flow-settings";
import type { SettingsAboutPort } from "./ports";

export type SettingsAboutRowId = "version" | "terms" | "x" | "instagram" | "github";

export type SettingsAboutSectionId = "legal" | "social";

export type SettingsAboutRowViewProps = Readonly<SettingsRowProps & { id: SettingsAboutRowId }>;

export type SettingsAboutSectionViewProps = Readonly<{
  id: SettingsAboutSectionId;
  title?: string;
  rows: readonly SettingsAboutRowViewProps[];
}>;

export type SettingsAboutViewProps = Readonly<{
  sections: readonly SettingsAboutSectionViewProps[];
  testID?: string;
}>;

export type SettingsAboutProps = Readonly<{ port: SettingsAboutPort; testID?: string }>;
