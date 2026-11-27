import { useSettingsPort } from "@features/flow-settings";
import type { SettingsAboutPort } from "./ports";

/** The About part of the port the app provides to the Settings. */
export function useSettingsAboutPort(): SettingsAboutPort {
  return useSettingsPort<SettingsAboutPort>();
}
