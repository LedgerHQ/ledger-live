import { z } from "zod";

export const SETTINGS_SECTIONS = [
  "general",
  "assetManagement",
  "security",
  "privacy",
  "about",
] as const;

const SettingsSectionIdSchema = z.enum(SETTINGS_SECTIONS);

export type SettingsSectionId = z.infer<typeof SettingsSectionIdSchema>;

export const DEFAULT_SETTINGS_SECTION: SettingsSectionId = "general";

export function resolveSettingsSection(section: unknown): SettingsSectionId {
  const parsed = SettingsSectionIdSchema.safeParse(section);
  return parsed.success ? parsed.data : DEFAULT_SETTINGS_SECTION;
}
