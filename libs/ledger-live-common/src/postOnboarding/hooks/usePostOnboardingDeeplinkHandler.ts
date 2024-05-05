import { useCallback } from "react";
import { DeviceModelId } from "@ledgerhq/devices";
import { useStartPostOnboardingCallback } from "./useStartPostOnboardingCallback";
import { usePostOnboardingEntryPointVisibleOnWallet } from "./usePostOnboardingEntryPointVisibleOnWallet";
import { usePostOnboardingHubState } from "./usePostOnboardingHubState";

export function usePostOnboardingDeeplinkHandler(navigateToHome, navigateToPostOnboardingHub) {
  const handleInitPostOnboarding = useStartPostOnboardingCallback();
  const isPostOnboardingVisible = usePostOnboardingEntryPointVisibleOnWallet();
  const { deviceModelId: postOnboardingDeviceModelId } = usePostOnboardingHubState();

  return useCallback(
    (device?: string) => {
      if (!device) {
        navigateToHome();
        return;
      }
      if (isPostOnboardingVisible && device === postOnboardingDeviceModelId) {
        navigateToPostOnboardingHub();
      } else if (device in DeviceModelId) {
        handleInitPostOnboarding({
          deviceModelId: device as DeviceModelId,
          mock: false,
          fallbackIfNoAction: () => navigateToHome(),
        });
      } else {
        navigateToHome();
      }
    },
    [
      handleInitPostOnboarding,
      isPostOnboardingVisible,
      navigateToHome,
      navigateToPostOnboardingHub,
      postOnboardingDeviceModelId,
    ],
  );
}
