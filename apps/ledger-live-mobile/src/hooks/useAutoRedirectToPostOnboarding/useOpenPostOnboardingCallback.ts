import { useStartPostOnboardingCallback } from "@ledgerhq/live-common/postOnboarding/hooks/useStartPostOnboardingCallback";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { useCallback } from "react";

/**
 * Returns a callback to open the post onboarding screen
 * */
export function useOpenPostOnboardingCallback() {
  const startPostOnboarding = useStartPostOnboardingCallback();
  return useCallback(
    (deviceModelId: DeviceModelId) => {
      startPostOnboarding({
        deviceModelId: deviceModelId,
        resetNavigationStack: false,
      });
    },
    [startPostOnboarding],
  );
}
