import { useSettingsPort } from "@features/flow-settings";
import type { PrivacySettingsPort } from "./ports";

/** The Privacy part of the port the app provides to the Settings. */
export function usePrivacySettingsPort(): PrivacySettingsPort {
  return useSettingsPort<PrivacySettingsPort>();
}
