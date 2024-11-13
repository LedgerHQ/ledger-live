import { useEffect } from "react";
import { useSelector } from "react-redux";
import { lastConnectedDeviceSelector } from "~/reducers/settings";
import { useOpenPostOnboardingCallback } from "./useOpenPostOnboardingCallback";
import { useShouldRedirect } from "./useShouldRedirect";
import { useOpenRecoverUpsellCallback } from "./useOpenRecoverUpsellCallback";
import { useIsFocused } from "@react-navigation/core";

/**
 * Navigates to the post onboarding or to the Ledger Recover upsell if needed
 * */
export function useAutoRedirectToPostOnboarding() {
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);

  const { shouldRedirectToRecoverUpsell, shouldRedirectToPostOnboarding } = useShouldRedirect();

  const openRecoverUpsell = useOpenRecoverUpsellCallback();
  const openPostOnboarding = useOpenPostOnboardingCallback();

  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) return;
    if (shouldRedirectToRecoverUpsell) {
      openRecoverUpsell();
    } else if (shouldRedirectToPostOnboarding && lastConnectedDevice) {
      openPostOnboarding(lastConnectedDevice.modelId);
    }
  }, [
    lastConnectedDevice,
    openPostOnboarding,
    openRecoverUpsell,
    shouldRedirectToPostOnboarding,
    shouldRedirectToRecoverUpsell,
    isFocused,
  ]);
}
