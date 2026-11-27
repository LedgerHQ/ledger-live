import { useSettingsPort } from "@features/flow-settings";
import type { AssetManagementSettingsPort } from "./ports";

/** The Asset management part of the port the app provides to the Settings. */
export function useAssetManagementSettingsPort(): AssetManagementSettingsPort {
  return useSettingsPort<AssetManagementSettingsPort>();
}
