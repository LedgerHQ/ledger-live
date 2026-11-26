import { useIsSettingsHomeEnabled } from "./useIsSettingsHomeEnabled";

export type SettingsHomeGateViewModel = Readonly<{ showLegacySettings: boolean }>;

export function useSettingsHomeGateViewModel(): SettingsHomeGateViewModel {
  return { showLegacySettings: !useIsSettingsHomeEnabled() };
}
