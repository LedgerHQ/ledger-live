import { DeviceModelId } from "@ledgerhq/types-devices";
import { useCallback } from "react";
import { useStartPostOnboardingCallback } from "@ledgerhq/live-common/postOnboarding/hooks/useStartPostOnboardingCallback";

export function useOpenPostOnboardingCallback() {
  const handleStartPostOnboarding = useStartPostOnboardingCallback();
  return useCallback(
    ({
      deviceModelId,
      fallbackRedirection,
    }: {
      deviceModelId: DeviceModelId;
      fallbackRedirection: () => void;
    }) => {
      setImmediate(() => {
        handleStartPostOnboarding({
          deviceModelId,
          fallbackIfNoAction: fallbackRedirection,
        });
      });
    },
    [handleStartPostOnboarding],
  );
}
