import { useCallback } from "react";
import { useFeature } from "@features/platform-feature-flags";
import { setOverride } from "@shared/feature-flags";
import { useDispatch } from "~/context/hooks";

/** Turns `newSettings` off on this device with a local override, kept across restarts. */
export function useSwitchToLegacySettings(): () => void {
  const dispatch = useDispatch();
  const newSettings = useFeature("newSettings");

  return useCallback(() => {
    dispatch(setOverride({ key: "newSettings", value: { ...newSettings, enabled: false } }));
  }, [dispatch, newSettings]);
}
