import { useEffect } from "react";
import { useSelector } from "react-redux";
import { lastConnectedDeviceSelector } from "~/reducers/settings";
import { useOpenPostOnboardingCallback } from "./useOpenPostOnboardingCallback";
import { useShouldRedirect } from "./useShouldRedirect";
import { useOpenProtectUpsellCallback } from "./useOpenProtectUpsellCallback";
import { useIsFocused } from "@react-navigation/core";

/**
 * Redirects the user to the post onboarding or the protect (Ledger Recover) upsell if needed
 * */
export function useAutoRedirectToPostOnboarding() {
  const focused = useIsFocused();
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);

  const { shouldRedirectToProtectUpsell, shouldRedirectToPostOnboarding } = useShouldRedirect();

  const openProtectUpsell = useOpenProtectUpsellCallback();
  const openPostOnboarding = useOpenPostOnboardingCallback();

  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) return;
    if (shouldRedirectToProtectUpsell) {
      openProtectUpsell();
    } else if (shouldRedirectToPostOnboarding && lastConnectedDevice) {
      openPostOnboarding(lastConnectedDevice.modelId);
    }
  }, [
    lastConnectedDevice,
    openPostOnboarding,
    openProtectUpsell,
    shouldRedirectToPostOnboarding,
    shouldRedirectToProtectUpsell,
    focused,
    isFocused,
  ]);
}
