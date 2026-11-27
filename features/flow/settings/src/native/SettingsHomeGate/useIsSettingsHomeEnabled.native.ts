import { useFeature } from "@features/platform-feature-flags";

/** Whether the new mobile Settings home replaces the legacy one (`newSettings`). */
export function useIsSettingsHomeEnabled(): boolean {
  return useFeature("newSettings")?.enabled ?? false;
}
