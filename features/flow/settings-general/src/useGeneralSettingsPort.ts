import { useSettingsPort } from "@features/flow-settings";
import type { GeneralSettingsPort, RegionSettingsPort } from "./ports";

/** The General part of the port the app provides to the Settings. */
export function useGeneralSettingsPort(): GeneralSettingsPort {
  return useSettingsPort<GeneralSettingsPort>();
}

/** The Region part of the port, which only the desktop app provides. */
export function useRegionSettingsPort(): RegionSettingsPort {
  return useSettingsPort<RegionSettingsPort>();
}
