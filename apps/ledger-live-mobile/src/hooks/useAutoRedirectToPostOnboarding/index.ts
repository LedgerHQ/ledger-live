import { useEffect, useState } from "react";
import { useSelector } from "~/context/hooks";
import { lastConnectedDeviceSelector } from "~/reducers/settings";
import { useOpenPostOnboardingCallback } from "./useOpenPostOnboardingCallback";
import { useShouldRedirect } from "./useShouldRedirect";
import { useOpenRecoverUpsellCallback } from "./useOpenRecoverUpsellCallback";
import { useIsFocused } from "@react-navigation/core";

export type PostOnboardingRedirectStatus = "none" | "pending" | "redirected";

type RedirectAttemptOutcome = "redirected" | "skipped";

/**
 * Navigates to the post onboarding or to the Ledger Recover upsell if needed
 * */
export function useAutoRedirectToPostOnboarding(): PostOnboardingRedirectStatus {
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);

  const { shouldRedirectToRecoverUpsell, shouldRedirectToPostOnboarding } = useShouldRedirect();

  const openRecoverUpsell = useOpenRecoverUpsellCallback();
  const openPostOnboarding = useOpenPostOnboardingCallback();

  const isFocused = useIsFocused();
  const [attemptOutcome, setAttemptOutcome] = useState<RedirectAttemptOutcome | null>(null);

  useEffect(() => {
    if (!isFocused) return;
    const recordOutcome = (attempt: Promise<boolean>) =>
      attempt
        .catch(() => false)
        .then(hasRedirected => setAttemptOutcome(hasRedirected ? "redirected" : "skipped"));
    if (shouldRedirectToRecoverUpsell) {
      void recordOutcome(openRecoverUpsell());
    } else if (shouldRedirectToPostOnboarding && lastConnectedDevice) {
      void recordOutcome(openPostOnboarding(lastConnectedDevice.modelId));
    }
  }, [
    lastConnectedDevice,
    openPostOnboarding,
    openRecoverUpsell,
    shouldRedirectToPostOnboarding,
    shouldRedirectToRecoverUpsell,
    isFocused,
  ]);

  const hasRedirectToAttempt =
    shouldRedirectToRecoverUpsell || (shouldRedirectToPostOnboarding && !!lastConnectedDevice);

  if (attemptOutcome === "redirected") return "redirected";
  if (hasRedirectToAttempt && attemptOutcome !== "skipped") return "pending";
  return "none";
}
