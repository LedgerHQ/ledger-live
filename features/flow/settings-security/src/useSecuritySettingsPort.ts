import { useSettingsPort } from "@features/flow-settings";
import type { SecuritySettingsPort } from "./ports";

/** The Security part of the port the app provides to the Settings. */
export function useSecuritySettingsPort(): SecuritySettingsPort {
  return useSettingsPort<SecuritySettingsPort>();
}
